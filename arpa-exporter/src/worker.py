import json
import os
import signal
import tempfile
import zipfile
from typing import List, Dict
from pydantic import BaseModel
import csv

import boto3
import botocore.client
import botocore.exceptions
import structlog

from src.lib.logging import get_logger, reset_contextvars


TASK_QUEUE_URL = os.environ["TASK_QUEUE_URL"]
DATA_DIR = os.getenv('DATA_DIR', 'arpa-exporter/src/data')
METADATA_DIR = os.path.join(DATA_DIR, 'archive_metadata')


class UploadInfo(BaseModel):
    upload_id: str
    filename_in_zip: str
    directory_location: str
    agency_name: str
    ec_code: str
    reporting_period_name: str
    validity: str


class S3Schema(BaseModel):
    bucket: str
    key: str


class MessageSchema(BaseModel):
    s3: S3Schema
    organization_id: int
    metadata_filename: str


class ShutdownHandler:
    def __init__(self):
        self._shutdown_requested = False
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

    def _handle_signal(self, signum, frame):
        get_logger().warn(
            "shutdown signal received; requesting shutdown...",
            signal=signal.strsignal(signum),
        )
        self._shutdown_requested = True

    def is_shutdown_requested(self):
        return self._shutdown_requested


def build_zip(fh, source_paths: List[UploadInfo]):
    logger = get_logger(total_source_files=len(source_paths))
    files_added = 0
    with zipfile.ZipFile(fh, 'a') as zipf:
        for upload in source_paths:
            entry_logger = logger.bind(source_path=os.path.join(DATA_DIR, f'{upload.upload_id}.xlsm'), entry_path=upload.directory_location)
            if upload.directory_location in zipf.namelist():
                entry_logger.info("file already exists in archive")
            else:
                try:
                    zipf.write(os.path.join(DATA_DIR, f'{upload.upload_id}.xlsm'), arcname=upload.directory_location)
                except:
                    entry_logger.exception(
                        "error writing source file to entry in archive"
                    )
                    raise
                files_added += 1
                entry_logger.info("Added file to the archive.")

    logger.info("updated zip archive", files_added=files_added)


def add_metadata_csv_to_zip(fh, metadata_filepath: str, metadata_filename: str):
    with zipfile.ZipFile(fh, 'a') as zipf:
        zipf.write(metadata_filepath, arcname=f'/metadata/{metadata_filename}')


def load_source_paths_from_csv(metadata_filepath: str):
    with open(metadata_filepath, 'r') as f:
        reader = csv.DictReader(f)
        return [UploadInfo(**row) for row in reader]


def get_metadata_filepath(organization_id: int, metadata_filename: str):
    return os.path.join(METADATA_DIR, organization_id, metadata_filename)


def process_sqs_message_request(s3, message_data: MessageSchema, local_file):
    # Get the S3 object if it already exists (if 404, assume it doesn't & create from scratch)
    # Note:
    #   Fargate ephemeral storage is free up to 20GB, so we should download and/or build
    #   the S3 file using tempfile storage. We have a good pattern for doing that using context
    #   managers in CPF Reporter.
    s3_bucket = message_data.s3.bucket
    s3_key = message_data.s3.key

    try:
        s3.download_fileobj(s3_bucket, s3_key, local_file)
    except botocore.exceptions.ClientError as e:
        if e.response["Error"]["Code"] != "404":
            get_logger().exception("error downloading S3 object")
            raise

    metadata_filepath = get_metadata_filepath(message_data.organization_id, message_data.metadata_filename)

    # Step 1 - Load all the source paths from the metadata CSV file
    try:
        source_paths = load_source_paths_from_csv(metadata_filepath)
    except:
        get_logger().exception("error loading source paths from CSV")
        raise

    # Step 2 - Add the metadata CSV to the zip archive
    try:
        add_metadata_csv_to_zip(local_file, metadata_filepath, message_data.metadata_filename)
    except:
        get_logger().exception("error adding metadata CSV to zip archive")
        raise

    # Step 3 - Add any files listed in the metadata CSV that are not already in the zip archive
    try:
        build_zip(local_file, source_paths=source_paths)
    except:
        get_logger().exception("error building zip archive")
        raise

    # Step 4 - Upload the zip archive back to S3
    try:
        local_file.seek(0)
        s3.upload_fileobj(local_file, s3_bucket, s3_key)
    except:
        get_logger().exception("error uploading zip archive to s3")
        raise


@reset_contextvars
def handle_work(s3, sqs):
    logger = get_logger()
    logger.info("long-polling next SQS message batch")
    try:
        response = sqs.receive_message(
            QueueUrl=TASK_QUEUE_URL, MaxNumberOfMessages=1, WaitTimeSeconds=20
        )
        message = response["Messages"][0]
    except botocore.exceptions.ClientError:
        logger.exception("error polling SQS for messages")
        raise
    except IndexError:
        # This is normal when there are no available messages in the queue
        logger.info("empty message batch received from SQS")
        return

    structlog.contextvars.bind_contextvars(
        sqs_message_receipt_handle=message["ReceiptHandle"]
    )
    logger.info("received message from SQS")
    try:
        raw_data = json.loads(message["Body"])
    except json.JSONDecodeError:
        # This is a problem with the message, not the worker, so don't re-raise
        logger.exception("error parsing request data from SQS message")
        return

    try:
        data = MessageSchema(**raw_data)
    except:
        logger.exception("SQS message data did not match expected schema")
        raise

    with tempfile.NamedTemporaryFile() as tfh:
        try:
            with structlog.contextvars.bound_contextvars(
                s3_bucket=data.s3.bucket,
                s3_key=data.s3.key,
                destination_file_path=tfh.name,
                destination_file_mode=tfh.mode,
            ):
                process_sqs_message_request(s3, data, tfh)
        except:
            logger.info("error processing SQS message request for ARPA data export")
            raise

    try:
        sqs.delete_message(
            QueueUrl=TASK_QUEUE_URL, ReceiptHandle=message["ReceiptHandle"]
        )
    except:
        logger.exception(
            "could not delete SQS message after it was succcessfully processed"
        )
        raise


def main():
    s3 = boto3.client("s3")
    sqs = boto3.client("sqs")

    shutdown_handler = ShutdownHandler()
    while shutdown_handler.is_shutdown_requested() is False:
        handle_work(s3, sqs)
    get_logger().warn("shutting down")


if __name__ == "__main__":
    main()

import json
import os
import tempfile
import zipfile
from pydantic import BaseModel
import csv
import io

import boto3
import botocore.client
import botocore.exceptions
import structlog

from src.lib.logging import get_logger, reset_contextvars
from src.lib.shutdown_handler import ShutdownHandler
from src.lib.email import send_email, generate_email

# from memory_profiler import profile

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
    zip_key: str
    metadata_key: str


class MessageSchema(BaseModel):
    s3: S3Schema
    organization_id: int
    user_email: str


def build_zip(s3, fh, bucket_name: str, metadata_filename: str):
    logger = get_logger()
    files_added = 0
    with zipfile.ZipFile(fh, 'a') as archive:
        for upload in load_source_paths_from_csv(s3, bucket_name, metadata_filename):
            source_path = os.path.join(os.getenv('DATA_DIR', 'arpa-exporter/src/data'), f'{upload.upload_id}.xlsm')
            entry_logger = logger.bind(source_path=source_path, entry_path=upload.directory_location)
            if upload.directory_location in archive.namelist():
                entry_logger.info("file already exists in archive")
            else:
                try:
                    archive.write(source_path, arcname=upload.directory_location)
                except:
                    entry_logger.exception(
                        "error writing source file to entry in archive"
                    )
                    raise
                files_added += 1
                entry_logger.info("Added file to the archive.")

    logger.info("updated zip archive", files_added=files_added)


def load_source_paths_from_csv(s3, bucket, file_key: str):
    response = s3.get_object(
            Bucket=bucket,
            Key=file_key,
        )
    bytes_stream = response["Body"]
    csv_file_stream = io.TextIOWrapper(bytes_stream, encoding="utf-8")
    reader = csv.DictReader(
        csv_file_stream, delimiter=","
    )

    for row in reader:
        yield UploadInfo(**row)


def build_and_send_email(email_client, user_email: str, download_link: str):
    logger = get_logger()
    email_html, email_text, subject = generate_email(logger, download_link)
    send_email(
        email_client,
        dest_email=user_email,
        email_html=email_html or "",
        email_text=email_text or "",
        subject=subject or "",
        logger=logger,
    )

def process_sqs_message_request(s3, ses, message_data: MessageSchema, local_file):
    # Get the S3 object if it already exists (if 404, assume it doesn't & create from scratch)
    # Note:
    #   Fargate ephemeral storage is free up to 20GB, so we should download and/or build
    #   the S3 file using tempfile storage. We have a good pattern for doing that using context
    #   managers in CPF Reporter.
    s3_bucket = message_data.s3.bucket
    s3_key = message_data.s3.zip_key

    # Step 1 - Download the existing zip archive from S3 if exists
    try:
        s3.download_fileobj(s3_bucket, s3_key, local_file)
    except botocore.exceptions.ClientError as e:
        if e.response["Error"]["Code"] != "404":
            get_logger().exception("error downloading S3 object")
            raise

    # Step 2 - Add or update contents of the zipfile with the new metadata
    try:
        build_zip(s3, local_file, message_data.s3.bucket, message_data.s3.metadata_key)
    except:
        get_logger().exception("error building zip archive")
        raise

    # Step 3 - Upload the zip archive back to S3
    try:
        local_file.seek(0)
        s3.upload_fileobj(local_file, s3_bucket, s3_key)
    except:
        get_logger().exception("error uploading zip archive to s3")
        raise

    # Step 4 - Send Email to user with the download link
    try:
        build_and_send_email(ses, message_data.user_email, download_link=f"/api/uploads/{message_data.organization_id}/getFullFileExport")
    except:
        get_logger().exception("error sending email to user")
        raise


@reset_contextvars
def handle_work(s3, sqs, ses):
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
                process_sqs_message_request(s3, ses, data, tfh)
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
    ses = boto3.client("ses")

    shutdown_handler = ShutdownHandler(logger=get_logger())
    while shutdown_handler.is_shutdown_requested() is False:
        handle_work(s3, sqs, ses)
    get_logger().warn("shutting down")


if __name__ == "__main__":
    main()

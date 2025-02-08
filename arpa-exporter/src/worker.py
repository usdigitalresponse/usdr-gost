from __future__ import annotations

import csv
import datetime
import io
import json
import os
import tempfile
import typing
import zipfile

import boto3
import botocore.client
import botocore.exceptions
import pydantic
import structlog

from src.lib.email import generate_email, send_email
from src.lib.logging import get_logger, reset_contextvars
from src.lib.shutdown_handler import ShutdownHandler

if typing.TYPE_CHECKING:  # pragma: nocover
    from mypy_boto3_s3 import S3Client
    from mypy_boto3_ses import SESClient
    from mypy_boto3_sqs import SQSClient

TASK_QUEUE_URL = os.environ["TASK_QUEUE_URL"]
TASK_QUEUE_RECEIVE_TIMEOUT = int(os.getenv("TASK_QUEUE_RECEIVE_TIMEOUT", 20))
DATA_DIR = os.environ["DATA_DIR"]
METADATA_DIR = os.path.join(DATA_DIR, "archive_metadata")
DOWNLOAD_URL_EXPIRATION_SECONDS = int(datetime.timedelta(hours=24).total_seconds())


class UploadInfo(pydantic.BaseModel):
    upload_id: str
    filename_in_zip: str  # Drop this
    directory_location: str  # Rename to path_in_zip
    agency_name: str
    ec_code: str
    reporting_period_name: str
    validity: str


class S3Schema(pydantic.BaseModel):
    bucket: str
    zip_key: str
    metadata_key: str


class MessageSchema(pydantic.BaseModel):
    s3: S3Schema
    organization_id: int
    user_email: str


def build_zip(fh: typing.BinaryIO, source_uploads: typing.Iterator[UploadInfo]) -> bool:
    logger = get_logger()
    files_added = 0
    files_checked = 0
    with zipfile.ZipFile(fh, "a") as archive:
        for upload in source_uploads:
            files_checked += 1
            source_path = os.path.join(DATA_DIR, f"{upload.upload_id}.xlsm")
            entry_logger = logger.bind(
                source_path=source_path,
                entry_path=upload.directory_location,
            )

            if upload.directory_location in archive.namelist():
                entry_logger.info("file already exists in archive")
                continue

            try:
                archive.write(source_path, arcname=upload.directory_location)
            except:
                entry_logger.exception("error writing source file to entry in archive")
                raise

            files_added += 1
            entry_logger.info(
                "Added file to the archive.",
                files_added=files_added,
                files_checked=files_checked,
            )

    logger = logger.bind(files_added=files_added, files_checked=files_checked)
    if files_added == 0:
        if files_checked == 0:
            logger.info(
                "zip archive not updated because metadata provided no source files"
            )
        else:
            logger.info(
                "zip archive not updated because entries already exist "
                "for all files named in metadata"
            )
        return False

    logger.info("updated zip archive")
    return True


def load_source_uploads_from_csv(
    s3: S3Client, bucket: str, file_key: str
) -> typing.Iterator[UploadInfo]:
    logger = get_logger(csv_bucket=bucket, csv_file_key=file_key)
    try:
        response = s3.get_object(
            Bucket=bucket,
            Key=file_key,
        )
    except botocore.exceptions.ClientError:
        logger.exception("error retrieving CSV file from S3")
        raise

    try:
        bytes_stream = response["Body"]
        csv_file_stream = io.TextIOWrapper(bytes_stream, encoding="utf-8")  # type: ignore
        reader = csv.DictReader(csv_file_stream, delimiter=",")
        for row in reader:
            yield UploadInfo(**row)
    except:
        logger.exception("error reading CSV data from S3")
        raise


def notify_user(
    s3: S3Client,
    ses: SESClient,
    download_bucket: str,
    download_key: str,
    user_email: str,
):
    logger = get_logger(
        download_bucket=download_bucket,
        download_key=download_key,
        download_expiration=f"{DOWNLOAD_URL_EXPIRATION_SECONDS} seconds",
    )
    try:
        download_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": download_bucket, "Key": download_key},
            ExpiresIn=DOWNLOAD_URL_EXPIRATION_SECONDS,
        )
    except:
        logger.exception("error generating presigned s3 get_object URL for email")
        raise

    try:
        email_html, email_text, subject = generate_email(download_url)
    except:
        logger.exception("error generating content for email")
        raise

    try:
        message_id = send_email(
            ses,
            dest_email=user_email,
            email_html=email_html,
            email_text=email_text,
            subject=subject,
        )
        logger.info("email notification sent", ses_message_id=message_id)
    except:
        logger.exception("error sending email")
        raise


def process_sqs_message_request(
    s3: S3Client, ses: SESClient, message_data: MessageSchema, local_file
):
    # Get the S3 object if it already exists.
    # If 404, assume it doesn't & create from scratch.
    # Note:
    #   Fargate ephemeral storage is free up to 20GB, so we should download and/or build
    #   the S3 file using tempfile storage. We have a good pattern for doing that using context
    #   managers in CPF Reporter.
    s3_bucket = message_data.s3.bucket
    s3_key = message_data.s3.zip_key
    logger = get_logger()

    # Step 1 - Download the existing zip archive from S3 if exists
    try:
        s3.download_fileobj(s3_bucket, s3_key, local_file)
        logger = logger.bind(updating_existing_zip_file_from_s3=True)
        logger.info("downloaded existing s3 object for zip file")
    except botocore.exceptions.ClientError as e:
        if e.response["Error"]["Code"] != "404":
            logger.exception("error downloading S3 object")
            raise
        else:
            logger = logger.bind(updating_existing_zip_file_from_s3=False)
            logger.info("no existing s3 object found for zip file")

    # Step 2 - Add or update contents of the zipfile with the new metadata
    try:
        source_data = load_source_uploads_from_csv(
            s3, message_data.s3.bucket, message_data.s3.metadata_key
        )
        zip_has_updates = build_zip(local_file, source_data)
        logger.info(
            "local zip file contains all entries from CSV metadata",
            zip_updated=zip_has_updates,
        )
    except:
        logger.exception("error building zip archive")
        raise

    # Step 3 - Upload the zip archive back to S3
    if zip_has_updates:
        try:
            local_file.seek(0)
            s3.upload_fileobj(local_file, s3_bucket, s3_key)
            logger.info("zip file uploaded to s3")
        except:
            logger.exception("error uploading zip archive to s3")
            raise
    else:
        logger.info("skipped uploading zip file to s3 because there are no changes")

    # Step 4 - Notify user and download link via email
    try:
        notify_user(s3, ses, s3_bucket, s3_key, message_data.user_email)
    except:
        get_logger().exception("error sending user notification")
        raise


@reset_contextvars
def handle_work(s3: S3Client, sqs: SQSClient, ses: SESClient):
    logger = get_logger()
    logger.info("long-polling next SQS message batch")
    try:
        response = sqs.receive_message(
            QueueUrl=TASK_QUEUE_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=TASK_QUEUE_RECEIVE_TIMEOUT,
        )
        message = response.get("Messages", [])[0]
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
    except pydantic.ValidationError:
        # This is potentially a problem with the message, not the worker, so don't re-raise
        logger.exception("SQS message data did not match expected schema")
        return

    with tempfile.NamedTemporaryFile() as tfh:
        with structlog.contextvars.bound_contextvars(
            s3_bucket=data.s3.bucket,
            s3_zip_key=data.s3.zip_key,
            s3_metadata_key=data.s3.metadata_key,
            destination_file_path=tfh.name,
            destination_file_mode=tfh.mode,
        ):
            try:
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
    s3: S3Client = boto3.client("s3")
    sqs: SQSClient = boto3.client("sqs")
    ses: SESClient = boto3.client("ses")

    shutdown_handler = ShutdownHandler(logger=get_logger())
    while shutdown_handler.is_shutdown_requested() is False:
        handle_work(s3, sqs, ses)
    get_logger().warn("shutting down")


if __name__ == "__main__":
    main()

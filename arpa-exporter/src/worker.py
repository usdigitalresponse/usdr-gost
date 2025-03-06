from __future__ import annotations

import csv
import datetime
import io
import json
import os
import tempfile
import typing
import urllib.parse
import zipfile

import boto3
import botocore.client
import botocore.exceptions
import pydantic
import structlog
from ddtrace import tracer

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
DOWNLOAD_URL_EXPIRATION_SECONDS = int(datetime.timedelta(hours=24).total_seconds())
API_DOMAIN = os.environ["API_DOMAIN"]


class UploadInfo(pydantic.BaseModel):
    """Maps information about local, user-uploaded files
    to corresponding entry locations in a zip file.
    """

    upload_id: str
    path_in_zip: str


class S3Schema(pydantic.BaseModel):
    """Provides information about S3-hosted resources accessed during worker execution."""

    bucket: str
    zip_key: str
    metadata_key: str


class MessageSchema(pydantic.BaseModel):
    """Schema for messages received from the SQS queue"""

    s3: S3Schema
    organization_id: int
    user_email: str


@tracer.wrap()
def build_zip(fh: typing.BinaryIO, source_uploads: typing.Iterator[UploadInfo]) -> bool:
    """Appends file entries named by ``source_uploads`` to an open zip archive,
    skipping those whose names are already present in the zip.

    Args:
        fh: Open, writeable zip file handler or file-like object
        source_uploads: Iterator of ``UploadInfo`` used to map source files from
            a local filesystem to entries of the zip file.

    Returns:
        bool indicating whether any new entries were appended to the zip file.
        If False, no writes were made to the zip file and it is unmodified.
    """
    logger = get_logger()
    files_added = 0
    files_checked = 0
    with zipfile.ZipFile(fh, "a") as archive:
        for upload in source_uploads:
            files_checked += 1
            _, file_extension = os.path.splitext(upload.path_in_zip)
            source_path = os.path.join(DATA_DIR, f"{upload.upload_id}{file_extension}")
            # Use ZipInfo filename to pre-normalize the destination path:
            path_in_zip = zipfile.ZipInfo.from_file(
                source_path, upload.path_in_zip
            ).filename
            entry_logger = logger.bind(
                source_path=source_path,
                entry_path=path_in_zip,
            )
            if path_in_zip != upload.path_in_zip:  # pragma: nocover
                entry_logger.warn(
                    "received and normalized an entry path that was not zipfile compatible",
                    incompatible_entry_path=upload.path_in_zip,
                )

            if path_in_zip in archive.namelist():
                entry_logger.info("file already exists in archive")
                continue

            try:
                archive.write(source_path, arcname=path_in_zip)
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
    """Downloads a CSV file from S3 and yields instances of ``UploadInfo``
    populated from its rows.

    This function streams CSV data from S3; requests will potentially be made to S3
    until the returned iterator is exhausted.

    Args:
        s3: S3 client for downloading the CSV file
        bucket: Name of the S3 bucket containing the CSV file object
        file_key: S3 key for the CSV file object

    Returns:
        Generator of ``UploadInfo``

    Yields:
        Instances of ``UploadInfo`` built from CSV row data
    """
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


def build_url(base_url: str, endpoint: str = ""):
    """Combines a base URL or domain name with a given endpoint.

    Essentially a more robust version of ``f"{base_url}/{endpoint}"``
    or ``urljoin(base_url, endpoint)``, which handles the following edge cases:

        - Default to ``https://`` scheme when missing in ``base_url``
        - Ensure that ``base_url`` and ``endpoint`` are separated
            by exactly 1 forward slash character, regardless of trailing/leading
            forward slashes present (respectively) in either argument,
            without dropping any segments from either argument.

    Args:
        base_url: A base URL (like ``http://example.com``) or domain name (like ``example.com``).
            This value may include path segments, which will be prepended
            to any ``endpoint`` path segments in the return value.
        endpoint: (Optional) A URL path of zero or more ``/``-separated path segments.

    Returns:
        A URL joined from the two parameters that always has a scheme,
        which includes no parameters, query arguments, or fragments.
    """
    if "//" not in base_url:
        base_url = f"https://{base_url}"

    scheme, netloc, path, _, _, _ = urllib.parse.urlparse(base_url)
    if not path.startswith("/"):
        path = f"/{path}"
    if not path.endswith("/"):
        path = f"{path}/"
    endpoint = endpoint.lstrip("/")

    return urllib.parse.urljoin(
        urllib.parse.ParseResult(scheme, netloc, path, "", "", "").geturl(),
        endpoint,
    )


def notify_user(
    ses: SESClient,
    user_email: str,
    user_organization_id: int | str,
):
    """Generates and sends an email notification that provides a URL for
    downloading a zip file from S3.

    Args:
        s3: S3 client used to generate the presigned URL for the downloadable object
        ses: SES client used to send the email
        download_bucket: S3 bucket containing the downloadable object
        download_key: S3 key of the downloadable object
        user_email: The email address of the user to notify
    """
    logger = get_logger(organization_id=user_organization_id)
    try:
        zip_download_url = build_url(
            API_DOMAIN,
            "/api/exports/getFullFileExport/archive",
        )
        csv_download_url = build_url(
            API_DOMAIN,
            "/api/exports/getFullFileExport/metadata",
        )
        logger = logger.bind(
            zip_download_url=zip_download_url,
            csv_download_url=csv_download_url,
        )
    except:
        logger.exception("error generating download URLs for email")
        raise

    try:
        email_html, email_text, subject = generate_email(
            zip_download_url, csv_download_url
        )
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


@tracer.wrap()
def process_sqs_message_request(
    s3: S3Client, ses: SESClient, message_data: MessageSchema, local_file
):
    """Handles work for a single SQS message, orchestrating the following steps:

    1. Downloads a zip file S3 object (if it exists) to ``local_file``
    2. Streams a CSV object from S3 and uses its contents to determine
        updates to the downloaded zip file.
    3. If changes were made to the downloaded zip file, it is uploaded to S3,
        potentially replacing an extant S3 object.
    4. Notifies a user identified in the SQS message that the new/updated zip file
        is ready for download.

    Args:
        s3: S3 client used to download, upload, and stream objects
        ses: SES client used to send email
        message_data: Work parameters provided by SQS
        local_file: An open, read/write binary file-like object that will be used
            to store zip file contents while the function is running.
    """
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
            s3.upload_fileobj(
                local_file,
                s3_bucket,
                s3_key,
                ExtraArgs={"ServerSideEncryption": "AES256"},
            )
            logger.info("zip file uploaded to s3")
        except:
            logger.exception("error uploading zip archive to s3")
            raise
    else:
        logger.info("skipped uploading zip file to s3 because there are no changes")

    # Step 4 - Notify user and download link via email
    try:
        notify_user(ses, message_data.user_email, message_data.organization_id)
    except:
        get_logger().exception("error sending user notification")
        raise


@tracer.wrap()
@reset_contextvars
def handle_work(sqs: SQSClient, s3: S3Client, ses: SESClient):
    """Receives up to 1 message from SQS, processes it, and then deletes it
    if no unhandled errors occurred during processing.

    Args:
        sqs: SQS client used to receive and delete a message from the queue at ``TASK_QUEUE_URL``
        s3: S3 client used for processing work indicated by a received  SQS message
        ses: SES client used to notify users that work is complete
    """
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

    with tracer.trace("arpa_exporter.handle_message", span_type="process"):
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
            # This is potentially a problem with the message, not the worker,
            # so don't re-raise
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
                    logger.info(
                        "error processing SQS message request for ARPA data export"
                    )
                    raise

    with tracer.trace("cleanup_message", span_type="settle"):
        try:
            sqs.delete_message(
                QueueUrl=TASK_QUEUE_URL, ReceiptHandle=message["ReceiptHandle"]
            )
        except:
            logger.exception(
                "could not delete SQS message after it was succcessfully processed"
            )
            raise


@tracer.wrap(name="arpa_exporter.worker", span_type="consumer")
def main() -> None:
    """Main work loop that calls ``handle_work()`` until a shutdown is requested
    by SIGINT or SIGTERM. When a shutdown is requested, any in-flight work is finished
    before this function returns.
    """
    sqs: SQSClient = boto3.client("sqs")
    s3: S3Client = boto3.client("s3")
    ses: SESClient = boto3.client("ses")

    shutdown_handler = ShutdownHandler(logger=get_logger())
    with tracer.trace(name="arpa_exporter.worker.main_loop"):
        while shutdown_handler.is_shutdown_requested() is False:
            handle_work(sqs, s3, ses)
    get_logger().warn("shutting down")


if __name__ == "__main__":
    main()

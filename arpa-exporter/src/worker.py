import json
import os
import signal
import tempfile
import zipfile

import boto3
import botocore.client
import botocore.exceptions
import structlog

from src.lib.logging import get_logger, reset_contextvars


TASK_QUEUE_URL = os.environ["TASK_QUEUE_URL"]


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


def get_entry_path(source_path):
    # TODO: return the path to where the source file should go in the archive
    return source_path


def build_zip(fh, source_paths):
    # TODO: for each source file:
    #   1. figure out its destination path for the archive
    #   2. if the archive does not already contain an entry at the destination path, add it
    logger = get_logger(total_source_files=len(source_paths))
    files_added = 0

    with zipfile.ZipFile(fh, "a") as archive:
        for source_path in source_paths:
            entry_path = get_entry_path(source_path)
            entry_logger = logger.bind(source_path=source_path, entry_path=entry_path)
            if entry_path not in archive.namelist():
                try:
                    archive.write(source_path, arcname=entry_path)
                except:
                    entry_logger.exception(
                        "error writing source file to entry in archive"
                    )
                    raise
                files_added += 1
                entry_logger.info("added file to archive")
            else:
                # TODO should we log that it already exists?
                entry_logger.info("file already exists in archive")

    logger.info("updated zip archive", files_added=files_added)


def process_sqs_message_request(s3, message_data, local_file):
    # Get the S3 object if it already exists (if 404, assume it doesn't & create from scratch)
    # Note:
    #   Fargate ephemeral storage is free up to 20GB, so we should download and/or build
    #   the S3 file using tempfile storage. We have a good pattern for doing that using context
    #   managers in CPF Reporter.
    s3_bucket = message_data["s3"]["bucket"]
    s3_key = message_data["s3"]["key"]

    try:
        s3.download_fileobj(s3_bucket, s3_key, local_file)
    except botocore.exceptions.ClientError as e:
        if e.response["Error"]["Code"] != "404":
            get_logger().exception("error downloading S3 object")
            raise

    # TODO: use message_data to determine source files that should be in the archive
    try:
        build_zip(local_file, source_paths=message_data["sources"])
    except:
        get_logger().exception("error building zip archive")
        raise

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
        data = json.loads(message["Body"])
    except json.JSONDecodeError:
        # This is a problem with the message, not the worker, so don't re-raise
        logger.exception("error parsing request data from SQS message")
        return

    with tempfile.NamedTemporaryFile() as tfh:
        try:
            with structlog.contextvars.bound_contextvars(
                s3_bucket=data["s3"]["bucket"],
                s3_key=data["s3"]["key"],
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

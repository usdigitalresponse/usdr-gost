import datetime
import os

import boto3
import requests

from common.logging import setup_logger


logger = setup_logger(__name__)

GRANTS_GOV_BASE_URL = os.environ['GRANTS_GOV_BASE_URL']
GRANTS_SOURCE_DATA_BUCKET_NAME = os.environ['GRANTS_SOURCE_DATA_BUCKET_NAME']

grants_source_data_bucket = boto3.resource('s3').Bucket(GRANTS_SOURCE_DATA_BUCKET_NAME)


def handle(event: dict, context: object):
    logger.debug('Received invocation event', extra={'event': event})

    raw_timestamp = event['timestamp']
    db_date = datetime.datetime.strptime(raw_timestamp, '%Y-%m-%dT%H:%M:%S%z').date()
    log_context = {'db_date': db_date}
    logger.debug(
        'Parsed date from invocation event',
        extra={'raw_timestamp': raw_timestamp, **log_context}
    )

    stream_remote_file_to_s3(
        source_url=grants_url_for_date(db_date),
        destination_key=object_key_for_date(db_date),
        log_context=log_context,
    )


def grants_url_for_date(date: datetime.date) -> str:
    return f'{GRANTS_GOV_BASE_URL}/extract/GrantsDBExtract{date.strftime("%Y%m%d")}v2.zip'


def object_key_for_date(date: datetime.date) -> str:
    return f'sources/{date.strftime("%Y/%m/%d")}/grants.gov/archive.zip'


def stream_remote_file_to_s3(source_url, destination_key, log_context):
    log_context['source'] = source_url
    log_context['destination'] = destination_key
    logger.info('Starting remote file download', extra=log_context)

    with requests.get(url=source_url, stream=True) as download_response:
        download_response.raise_for_status()

        log_context['source_size_bytes'] = download_response.headers.get('Content-Length')
        logger.info('Streaming remote file to S3', extra=log_context)
        grants_source_data_bucket.upload_fileobj(
            download_response.raw,
            destination_key,
            ExtraArgs={'ServerSideEncryption': 'AES256'},
            Callback=make_transfer_callback(logger, dict(log_context)),
        )

    logger.info('Finished transferring source file to S3', extra=log_context)


def make_transfer_callback(callback_logger, log_context):
    tracked = {'chunk_counter': 0, 'cumulative_bytes_transferred': 0}

    def transfer_callback(bytes_transferred: int):
        tracked['chunk_counter'] += 1
        tracked['cumulative_bytes_transferred'] += bytes_transferred
        callback_logger.debug(
            'Transferred chunk to S3',
            extra={
                'chunk_size': bytes_transferred,
                'cumulative_size': tracked['cumulative_bytes_transferred'],
                'chunks_transferred': tracked['chunk_counter'],
                **log_context
            },
        )

    return transfer_callback

import datetime
import os

import boto3
import botocore.client
import requests
import zipfile
import urllib

from common.logging import setup_logger


logger = setup_logger(__name__)

GRANTS_GOV_BASE_URL = os.environ['GRANTS_GOV_BASE_URL']
GRANTS_SOURCE_DATA_BUCKET_NAME = os.environ['GRANTS_SOURCE_DATA_BUCKET_NAME']

boto_options = {}
if hostname := os.getenv("LOCALSTACK_HOSTNAME"):
    boto_options['endpoint_url'] = f'http://{hostname}:{os.environ["EDGE_PORT"]}'
    boto_options['config'] = botocore.client.Config(s3={'addressing_style': 'path'})

grants_source_data_bucket = boto3.resource('s3', **boto_options).Bucket(
    GRANTS_SOURCE_DATA_BUCKET_NAME
)
              
def handle(event: dict, context: object):
    logger.debug('Received invocation event', extra={'event': event})

    raw_timestamp = event['timestamp']
    db_date = datetime.datetime.strptime(raw_timestamp, '%Y-%m-%dT%H:%M:%S%z').date()
    log_context = {'db_date': db_date}
    logger.debug(
        'Parsed date from invocation event',
        extra={'raw_timestamp': raw_timestamp, **log_context}
    )
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    try:
        # Download here
        grants_source_data_bucket.download_file(bucket,'archive.zip','/tmp/archive.zip')
    except Exception as e:
        print("Could not get archive from S3")
        raise e

    try:
        # Unzip here
        with zipfile.ZipFile("/tmp/archive.zip", mode="r") as archive:
            archive.extractall("/tmp/extract.xml")
    except Exception as e:
        print(f"Unable to extract zipfile : {e}")
        raise e

    try:
        # Upload here
        with open('/tmp/extract.xml', 'rb') as data:
            grants_source_data_bucket.upload_fileobj(
                data,
                key.replace("archive.zip", "extract.xml"),
                ExtraArgs={'ServerSideEncryption': 'AES256'},
                Callback=make_transfer_callback(logger, dict(log_context)),
            )
    except Exception as e:
        print(f"Failsed to upload extracted XML: {e}")
        raise e

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
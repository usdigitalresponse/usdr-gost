import os

import boto3
import moto
import moto.s3.responses
import pytest


os.environ['AWS_DEFAULT_REGION'] = moto.s3.responses.DEFAULT_REGION_NAME
os.environ['AWS_ACCESS_KEY_ID'] = 'test'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'test'

os.environ['GRANTS_GOV_BASE_URL'] = 'http://example.gov'
os.environ['GRANTS_SOURCE_DATA_BUCKET_NAME'] = 'grants-source-data'


@pytest.fixture(scope='function', autouse=True)
def configure_aws_resources():
    with moto.mock_s3():
        s3_client = boto3.client('s3', region_name=os.environ['AWS_DEFAULT_REGION'])
        s3_client.create_bucket(Bucket=os.environ['GRANTS_SOURCE_DATA_BUCKET_NAME'])
        yield

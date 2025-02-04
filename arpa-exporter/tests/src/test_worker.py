import multiprocessing
import multiprocessing.connection
import multiprocessing.spawn
import os
import signal
import time
from unittest import mock
import boto3

import pytest
import structlog

from src import worker

class TestWorker:
    def test_load_source_paths_from_csv(self):
        print('starting load_source_paths_from_csv')
        
        s3_client = boto3.client(
            service_name='s3',
            aws_access_key_id='test',
            aws_secret_access_key='test',
            endpoint_url='http://localhost:4566',
        )
        worker.load_source_paths_from_csv(s3_client, "sample_large_metadata.csv")

    def test_get_metadata_filepath(self):
        print('starting get_metadata_filepath')
        assert worker.get_metadata_filepath("99", "test.csv") == "arpa-exporter/src/data/archive_metadata/99/test.csv"
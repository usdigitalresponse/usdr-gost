import multiprocessing
import multiprocessing.connection
import multiprocessing.spawn
import os
import signal
import time
from unittest import mock
import boto3
from moto import mock_aws
import tempfile
import pytest
import structlog

from src import worker

class TestWorker:
    def test_build_zip(self):
        region = "us-west-2"
        bucket_name = "test-apra-audit-reports"
        s3_client = boto3.client("s3", region_name=region)
        s3_client.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={"LocationConstraint": region})
        s3_client.put_object(
            Bucket=bucket_name,
            Key="test_metadata.csv",
            Body=b"""upload_id,filename_in_zip,directory_location,agency_name,ec_code,reporting_period_name,validity
c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b,ARPA SFRF Reporting Workbook _10.15errortest--c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b.xlsm,Quarterly 1/Final Treasury/ARPA SFRF Reporting Workbook _10.15errortest--c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b.xlsm,USDR,EC2.2,Quarterly 1,Validated at 2025-01-03 14:46:10.180419+00 by asridhar@usdigitalresponse.org
eb97b891-66c7-4faf-8ea6-67b94d76d28b,ARPA SFRF Reporting Workbook _10.15errortest--eb97b891-66c7-4faf-8ea6-67b94d76d28b.xlsm,Quarterly 1/Final Treasury/ARPA SFRF Reporting Workbook _10.15errortest--eb97b891-66c7-4faf-8ea6-67b94d76d28b.xlsm,USDR,EC2.1,Quarterly 1,Validated at 2025-01-03 14:48:24.440976+00 by asridhar@usdigitalresponse.org
e9c689db-33fc-470e-a16d-a814c1630da1,ARPA SFRF Reporting Workbook _10.15errortest4--e9c689db-33fc-470e-a16d-a814c1630da1.xlsm,Quarterly 1/Not Final Treasury/Valid files/ARPA SFRF Reporting Workbook _10.15errortest4--e9c689db-33fc-470e-a16d-a814c1630da1.xlsm,USDR,EC2.2,Quarterly 1,Validated at 2025-01-03 04:27:32.920426+00 by asridhar@usdigitalresponse.org
9e6c295e-bd48-4827-9efb-ec91f0bd7607,ARPA SFRF Reporting Workbook _10.15errortest--9e6c295e-bd48-4827-9efb-ec91f0bd7607.xlsm,Quarterly 1/Not Final Treasury/Invalid files/ARPA SFRF Reporting Workbook _10.15errortest--9e6c295e-bd48-4827-9efb-ec91f0bd7607.xlsm,USDR,EC2.2,Quarterly 1,Invalidated at 2025-01-13 13:57:24.54424+00 by asridhar@usdigitalresponse.org"""
        )
        # Create 4 files into DATA_DIR with names:
        # c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b.xlsm
        # eb97b891-66c7-4faf-8ea6-67b94d76d28b.xlsm
        # e9c689db-33fc-470e-a16d-a814c1630da1.xlsm
        # 9e6c295e-bd48-4827-9efb-ec91f0bd7607.xlsm

        with tempfile.NamedTemporaryFile() as tmp:
            worker.build_zip(s3_client, tmp, bucket_name, "test_metadata.csv")

            # Check that the zip file has 4 files listed above in the appropriate directories

    @mock_aws
    def test_load_source_paths_from_csv(self):
        region = "us-west-2"
        bucket_name = "test-apra-audit-reports"
        s3_client = boto3.client("s3", region_name=region)
        s3_client.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={"LocationConstraint": region})
        s3_client.put_object(
            Bucket=bucket_name,
            Key="test_metadata.csv",
            Body=b"""upload_id,filename_in_zip,directory_location,agency_name,ec_code,reporting_period_name,validity
c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b,ARPA SFRF Reporting Workbook _10.15errortest--c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b.xlsm,Quarterly 1/Final Treasury/ARPA SFRF Reporting Workbook _10.15errortest--c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b.xlsm,USDR,EC2.2,Quarterly 1,Validated at 2025-01-03 14:46:10.180419+00 by asridhar@usdigitalresponse.org
eb97b891-66c7-4faf-8ea6-67b94d76d28b,ARPA SFRF Reporting Workbook _10.15errortest--eb97b891-66c7-4faf-8ea6-67b94d76d28b.xlsm,Quarterly 1/Final Treasury/ARPA SFRF Reporting Workbook _10.15errortest--eb97b891-66c7-4faf-8ea6-67b94d76d28b.xlsm,USDR,EC2.1,Quarterly 1,Validated at 2025-01-03 14:48:24.440976+00 by asridhar@usdigitalresponse.org
e9c689db-33fc-470e-a16d-a814c1630da1,ARPA SFRF Reporting Workbook _10.15errortest4--e9c689db-33fc-470e-a16d-a814c1630da1.xlsm,Quarterly 1/Not Final Treasury/Valid files/ARPA SFRF Reporting Workbook _10.15errortest4--e9c689db-33fc-470e-a16d-a814c1630da1.xlsm,USDR,EC2.2,Quarterly 1,Validated at 2025-01-03 04:27:32.920426+00 by asridhar@usdigitalresponse.org
9e6c295e-bd48-4827-9efb-ec91f0bd7607,ARPA SFRF Reporting Workbook _10.15errortest--9e6c295e-bd48-4827-9efb-ec91f0bd7607.xlsm,Quarterly 1/Not Final Treasury/Invalid files/ARPA SFRF Reporting Workbook _10.15errortest--9e6c295e-bd48-4827-9efb-ec91f0bd7607.xlsm,USDR,EC2.2,Quarterly 1,Invalidated at 2025-01-13 13:57:24.54424+00 by asridhar@usdigitalresponse.org"""
        )
        actual_upload_ids = []
        for row in worker.load_source_paths_from_csv(s3_client, bucket_name, "test_metadata.csv"):
            value = row.upload_id.strip()
            if value == "upload_id":
                continue
            actual_upload_ids.append(row.upload_id.strip())

        expected_upload_ids = [
            "c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b",
            "eb97b891-66c7-4faf-8ea6-67b94d76d28b",
            "e9c689db-33fc-470e-a16d-a814c1630da1",
            "9e6c295e-bd48-4827-9efb-ec91f0bd7607"
        ]
        assert actual_upload_ids == expected_upload_ids

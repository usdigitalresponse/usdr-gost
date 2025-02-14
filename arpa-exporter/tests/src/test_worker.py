import csv
import io
import json
import os
import tempfile
import zipfile
import zlib
from unittest import mock

import pydantic
import pytest

from src import worker
from src.lib.shutdown_handler import ShutdownHandler

SAMPLE_METADATA_1_CSV_PATH = os.path.join(
    os.environ["DATA_DIR"], "sample_metadata_1.csv"
)


@pytest.fixture
def sample_metadata_1_UploadInfo():
    with open(SAMPLE_METADATA_1_CSV_PATH) as fh:
        reader = csv.DictReader(fh)
        yield [worker.UploadInfo(**row) for row in reader]


class TestBuildZip:
    def test_build_zip_result(self, sample_metadata_1_UploadInfo):
        with tempfile.NamedTemporaryFile() as tmp:
            updated = worker.build_zip(tmp, (_ for _ in sample_metadata_1_UploadInfo))
            assert updated is True

            # Open the zip-file and make sure it has the correct files
            with zipfile.ZipFile(tmp, "r") as archive:
                assert set(archive.namelist()) == set(
                    _.path_in_zip for _ in sample_metadata_1_UploadInfo
                )

                # Compare checksums to ensure sources and destinations were mapped correctly
                for ui in sample_metadata_1_UploadInfo:
                    zipped_file_checksum = archive.getinfo(ui.path_in_zip).CRC
                    source_path = os.path.join(
                        os.environ["DATA_DIR"], f"{ui.upload_id}.xlsm"
                    )
                    with open(source_path, "rb") as source_fh:
                        source_file_checksum = zlib.crc32(source_fh.read())
                        assert source_file_checksum == zipped_file_checksum

    def test_skips_source_file_when_present_in_zip(self, sample_metadata_1_UploadInfo):
        extant_file_data = b"this is some test data"
        extant_file_entry_path = sample_metadata_1_UploadInfo[0].path_in_zip
        extant_file_checksum = zlib.crc32(extant_file_data)

        with tempfile.NamedTemporaryFile() as tmp:
            # Create the zip and populate one of the CSV entries with test data
            with zipfile.ZipFile(tmp, "w") as archive:
                archive.writestr(extant_file_entry_path, extant_file_data)
                assert len(archive.namelist()) == 1

            updated = worker.build_zip(tmp, (_ for _ in sample_metadata_1_UploadInfo))
            assert updated is True
            with zipfile.ZipFile(tmp, "r") as archive:
                # Ensure the zip now contains all files named in the CSV entries
                assert len(archive.namelist()) == len(sample_metadata_1_UploadInfo)
                # Ensure the extant file checksum is unchanged
                zipped_file_checksum = archive.getinfo(extant_file_entry_path).CRC
                assert extant_file_checksum == zipped_file_checksum

    def test_returns_False_without_modifying_zip_when_source_files_is_empty(self):
        with tempfile.NamedTemporaryFile() as tmp:
            updated = worker.build_zip(tmp, (_ for _ in []))
            assert updated is False
            with zipfile.ZipFile(tmp, "r") as archive:
                assert len(archive.namelist()) == 0

    def test_returns_False_when_all_source_files_are_present(
        self, sample_metadata_1_UploadInfo
    ):
        with tempfile.NamedTemporaryFile() as tmp:
            with zipfile.ZipFile(tmp, "w") as archive:
                for u in sample_metadata_1_UploadInfo:
                    archive.writestr(u.path_in_zip, "does not matter")
            updated = worker.build_zip(tmp, (_ for _ in sample_metadata_1_UploadInfo))
            assert updated is False
            with zipfile.ZipFile(tmp, "r") as archive:
                assert len(archive.namelist()) == len(sample_metadata_1_UploadInfo)

    def test_fails_when_source_file_does_not_exist(self, sample_metadata_1_UploadInfo):
        with tempfile.NamedTemporaryFile() as tmp:
            second_to_last_entry = sample_metadata_1_UploadInfo[-2]
            second_to_last_entry.upload_id = "this file does not exist"
            last_entry = sample_metadata_1_UploadInfo[-1]

            with pytest.raises(FileNotFoundError):
                worker.build_zip(tmp, (_ for _ in sample_metadata_1_UploadInfo))

            # Open the zip-file and make sure it has the correct files
            with zipfile.ZipFile(tmp, "r") as archive:
                assert second_to_last_entry.path_in_zip not in archive.namelist()
                assert last_entry.path_in_zip not in archive.namelist()
                assert set(archive.namelist()) == set(
                    ui.path_in_zip for ui in sample_metadata_1_UploadInfo[:-2]
                )


class TestLoadSourceUploadsFromCSV:
    BUCKET_NAME = "test-apra-audit-reports"

    @pytest.fixture(scope="function", autouse=True)
    def make_test_bucket(self, s3):
        s3.create_bucket(
            Bucket=self.BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": os.environ["AWS_REGION"]},
        )

    def test_load_source_uploads_from_csv(
        self,
        s3,
        sample_metadata_1_UploadInfo,
    ):
        csv_key = "test_metadata.csv"
        with open(SAMPLE_METADATA_1_CSV_PATH, "rb") as fh:
            s3.upload_fileobj(fh, Bucket=self.BUCKET_NAME, Key=csv_key)

        upload_info = worker.load_source_uploads_from_csv(s3, self.BUCKET_NAME, csv_key)
        actual_upload_ids = [ui.upload_id for ui in upload_info]
        expected_upload_ids = [ui.upload_id for ui in sample_metadata_1_UploadInfo]
        assert actual_upload_ids == expected_upload_ids

    def test_fails_when_s3_object_does_not_exist(self, s3):
        gen = worker.load_source_uploads_from_csv(
            s3, self.BUCKET_NAME, "does not exist.csv"
        )
        with pytest.raises(s3.exceptions.NoSuchKey):
            next(gen)

    def test_fails_when_object_data_is_invalid(self, s3):
        csv_key = "bad.csv"
        s3.upload_fileobj(
            io.BytesIO(b"this file contains data\nthat does not conform"),
            Bucket=self.BUCKET_NAME,
            Key=csv_key,
        )
        gen = worker.load_source_uploads_from_csv(s3, self.BUCKET_NAME, csv_key)
        with pytest.raises(pydantic.ValidationError):
            next(gen)

    def test_fails_when_some_data_is_invalid(self, s3, sample_metadata_1_UploadInfo):
        csv_key = "partial_invalid.csv"
        csv_file = io.TextIOWrapper(io.BytesIO())
        csv_writer = csv.DictWriter(
            csv_file,
            fieldnames=list(worker.UploadInfo.model_fields.keys()),
        )
        csv_writer.writeheader()
        csv_writer.writerows([u.model_dump() for u in sample_metadata_1_UploadInfo[:2]])
        csv_file.writelines(["this is not valid data\n"])
        csv_writer.writerows([u.model_dump() for u in sample_metadata_1_UploadInfo[2:]])
        csv_file.flush()
        csv_file.buffer.seek(0)
        s3.upload_fileobj(csv_file.buffer, Bucket=self.BUCKET_NAME, Key=csv_key)

        gen = worker.load_source_uploads_from_csv(s3, self.BUCKET_NAME, csv_key)
        assert next(gen) == sample_metadata_1_UploadInfo[0]
        assert next(gen) == sample_metadata_1_UploadInfo[1]
        with pytest.raises(pydantic.ValidationError):
            next(gen)


class TestNotifyUser:
    @mock.patch("src.worker.API_DOMAIN", new="https://api.example.org")
    def test_sends_email_with_download_urls(self, ses, ses_sent_messages):
        organization_id = "123"
        download_url_base = (
            f"https://api.example.org/api/uploads/{organization_id}/getFullFileExport"
        )
        expect_zip_url = f"{download_url_base}/archive"
        expect_csv_url = f"{download_url_base}/metadata"
        expect_email = "person@example.gov"

        worker.notify_user(ses, expect_email, organization_id)

        assert len(ses_sent_messages) == 1
        sent_message = ses_sent_messages[0]
        assert sent_message.destinations["ToAddresses"] == [expect_email]
        assert expect_zip_url in sent_message.body
        assert expect_csv_url in sent_message.body

    def test_fails_when_error_generating_zip_url(self, ses):
        expect_error = ValueError("oh no!")
        with mock.patch("src.worker.build_url", side_effect=expect_error):
            with pytest.raises(ValueError) as raised:
                worker.notify_user(
                    ses,
                    "person@example.gov",
                    "123",
                )
        assert raised.value == expect_error

    @mock.patch("src.worker.generate_email")
    def test_fails_when_error_generating_email(self, mock_generate_email, ses):
        expect_error = FileNotFoundError("could not find the template")
        mock_generate_email.side_effect = expect_error
        with pytest.raises(FileNotFoundError) as raised:
            worker.notify_user(ses, "person@example.gov", "123")
            assert mock_generate_email.called
        assert raised.value == expect_error

    def test_fails_when_error_sending_email(self, ses):
        with pytest.raises(ses.exceptions.ClientError):
            worker.notify_user(ses, "invalid email", "123")


class TestProcessSQSMessageRequest:
    BUCKET_NAME = "test-apra-audit-reports"

    @pytest.fixture
    def sqs_message(self):
        yield worker.MessageSchema(
            s3=worker.S3Schema(
                bucket=self.BUCKET_NAME,
                zip_key="archive-in-s3.zip",
                metadata_key="metadata.csv",
            ),
            organization_id=1234,
            user_email="fake@example.gov",
        )

    @pytest.fixture(scope="function", autouse=True)
    def make_test_bucket(self, s3, sqs_message):
        s3.create_bucket(
            Bucket=self.BUCKET_NAME,
            CreateBucketConfiguration={"LocationConstraint": os.environ["AWS_REGION"]},
        )
        with open(SAMPLE_METADATA_1_CSV_PATH, "rb") as fh:
            s3.upload_fileobj(
                fh, Bucket=sqs_message.s3.bucket, Key=sqs_message.s3.metadata_key
            )

    def test_fails_when_bucket_does_not_exist(self, s3, ses, sqs_message):
        sqs_message.s3.bucket = "does-not-exist"
        with pytest.raises(s3.exceptions.NoSuchBucket):
            worker.process_sqs_message_request(s3, ses, sqs_message, io.BytesIO())

    @pytest.mark.parametrize(
        "extant_zip_entries",
        ([], ["extra1.xlsm", "extra2.xlsm"]),
    )
    def test_uploads_populated_zip(
        self,
        s3,
        ses,
        sample_metadata_1_UploadInfo,
        extant_zip_entries,
        sqs_message,
    ):
        if len(extant_zip_entries) > 0:
            with tempfile.NamedTemporaryFile() as tmp:
                with zipfile.ZipFile(tmp, "w") as archive:
                    for fname in extant_zip_entries:
                        archive.writestr(fname, b"some placeholder content")
                tmp.seek(0)
                s3.upload_fileobj(tmp, self.BUCKET_NAME, sqs_message.s3.zip_key)

        with tempfile.NamedTemporaryFile() as tmp:
            worker.process_sqs_message_request(s3, ses, sqs_message, tmp)

        with tempfile.NamedTemporaryFile() as tmp:
            s3.download_fileobj(self.BUCKET_NAME, sqs_message.s3.zip_key, tmp)
            with zipfile.ZipFile(tmp, "r") as resulting_archive:
                actual_namelist = resulting_archive.namelist()
                expected_namelist = set(
                    _.path_in_zip for _ in sample_metadata_1_UploadInfo
                )
                for additional_entry in extant_zip_entries:
                    expected_namelist.add(additional_entry)
                assert expected_namelist == set(actual_namelist)

    def test_skips_upload_when_no_files_added_to_zip(
        self,
        s3,
        ses,
        sqs_message,
        sample_metadata_1_UploadInfo,
    ):
        with tempfile.NamedTemporaryFile() as tmp:
            with zipfile.ZipFile(tmp, "w") as archive:
                for ui in sample_metadata_1_UploadInfo:
                    archive.writestr(ui.path_in_zip, b"some placeholder content")
            tmp.seek(0)
            s3.upload_fileobj(tmp, self.BUCKET_NAME, sqs_message.s3.zip_key)

        with mock.patch.object(s3, "upload_fileobj") as mock_upload_file_object:
            with tempfile.NamedTemporaryFile() as tmp:
                worker.process_sqs_message_request(s3, ses, sqs_message, tmp)

        assert mock_upload_file_object.called is False

    def test_fails_when_csv_cannot_load(self, s3, ses, sqs_message):
        sqs_message.s3.metadata_key = "does-not-exist"
        with tempfile.NamedTemporaryFile() as tmp:
            with pytest.raises(s3.exceptions.NoSuchKey) as raised:
                worker.process_sqs_message_request(s3, ses, sqs_message, tmp)
            assert raised.value.response["Error"]["Key"] == sqs_message.s3.metadata_key

    def test_fails_without_sending_email_when_upload_fails(
        self, s3, ses, sqs_message, ses_sent_messages
    ):
        with mock.patch.object(s3, "upload_fileobj") as mock_upload_fileobj:
            upload_error = ValueError("you shall not pass")
            mock_upload_fileobj.side_effect = upload_error
            with tempfile.NamedTemporaryFile() as tmp:
                with pytest.raises(ValueError) as raised:
                    worker.process_sqs_message_request(s3, ses, sqs_message, tmp)
            assert raised.value == upload_error
            assert len(ses_sent_messages) == 0

    def test_fails_when_error_notifying_user(self, s3, ses, sqs_message):
        sqs_message.user_email = "invalid"
        with tempfile.NamedTemporaryFile() as tmp:
            with pytest.raises(ses.exceptions.ClientError):
                worker.process_sqs_message_request(s3, ses, sqs_message, tmp)


class TestHandleWork:
    @pytest.fixture(scope="function", autouse=False)
    def create_sqs_queue(self, sqs):
        rs = sqs.create_queue(QueueName="arpa-exporter-queue")
        with mock.patch("src.worker.TASK_QUEUE_URL", rs["QueueUrl"]):
            yield rs

    def test_fails_on_error_receiving_sqs_message(self, s3, sqs, ses):
        with pytest.raises(sqs.exceptions.QueueDoesNotExist):
            worker.handle_work(sqs, s3, ses)

    def test_returns_early_when_queue_is_empty(self, s3, sqs, ses, create_sqs_queue):
        with mock.patch(
            "src.worker.process_sqs_message_request"
        ) as mock_process_sqs_message_request:
            assert worker.handle_work(sqs, s3, ses) is None
            assert mock_process_sqs_message_request.call_count == 0

    def test_resturns_early_when_message_is_not_valid_json(
        self, s3, sqs, ses, create_sqs_queue
    ):
        sqs.send_message(
            QueueUrl=create_sqs_queue["QueueUrl"], MessageBody="[in{validJSON!"
        )
        with mock.patch(
            "src.worker.process_sqs_message_request"
        ) as mock_process_sqs_message_request:
            assert worker.handle_work(sqs, s3, ses) is None
            assert mock_process_sqs_message_request.call_count == 0

    def test_returns_early_when_message_json_does_not_match_schema(
        self, s3, sqs, ses, create_sqs_queue
    ):
        sqs.send_message(
            QueueUrl=create_sqs_queue["QueueUrl"],
            MessageBody=json.dumps({"unexpected": "schema"}),
        )
        with mock.patch(
            "src.worker.process_sqs_message_request"
        ) as mock_process_sqs_message_request:
            assert worker.handle_work(sqs, s3, ses) is None
            assert mock_process_sqs_message_request.call_count == 0

    def test_fails_when_sqs_message_cannot_be_processed(
        self, s3, sqs, ses, create_sqs_queue
    ):
        sqs.send_message(
            QueueUrl=create_sqs_queue["QueueUrl"],
            MessageBody=worker.MessageSchema(
                s3=worker.S3Schema(
                    bucket="does-not-exist",
                    zip_key="archive-in-s3.zip",
                    metadata_key="metadata.csv",
                ),
                organization_id=1234,
                user_email="fake@example.gov",
            ).model_dump_json(),
        )
        with mock.patch(
            "src.worker.process_sqs_message_request"
        ) as mock_process_sqs_message_request:
            process_error = ValueError("maybe the bucket didn't exist or something")
            mock_process_sqs_message_request.side_effect = process_error
            with pytest.raises(ValueError) as raised:
                worker.handle_work(sqs, s3, ses)
            assert raised.value == process_error

    def test_fails_when_sqs_message_cannot_be_deleted(
        self, s3, sqs, ses, create_sqs_queue
    ):
        sqs.send_message(
            QueueUrl=create_sqs_queue["QueueUrl"],
            MessageBody=worker.MessageSchema(
                s3=worker.S3Schema(
                    bucket="does-not-matter",
                    zip_key="does-not-matter.zip",
                    metadata_key="does-not-matter.csv",
                ),
                organization_id=1234,
                user_email="fake@example.gov",
            ).model_dump_json(),
        )
        with mock.patch("src.worker.process_sqs_message_request"):
            with mock.patch.object(sqs, "delete_message") as mock_sqs_delete_message:
                delete_message_error = ValueError("not allowed!")
                mock_sqs_delete_message.side_effect = delete_message_error

                with pytest.raises(ValueError) as raised:
                    worker.handle_work(sqs, s3, ses)
                assert raised.value is delete_message_error

    def test_deletes_successfully_processed_sqs_message(
        self, s3, sqs, ses, create_sqs_queue
    ):
        sqs.send_message(
            QueueUrl=create_sqs_queue["QueueUrl"],
            MessageBody=worker.MessageSchema(
                s3=worker.S3Schema(
                    bucket="does-not-matter",
                    zip_key="does-not-matter.zip",
                    metadata_key="does-not-matter.csv",
                ),
                organization_id=1234,
                user_email="fake@example.gov",
            ).model_dump_json(),
        )
        with mock.patch(
            "src.worker.process_sqs_message_request"
        ) as mock_process_sqs_message_request:
            with mock.patch.object(sqs, "delete_message") as mock_delete_message:
                assert worker.handle_work(sqs, s3, ses) is None
                assert mock_process_sqs_message_request.called
                assert mock_delete_message.called


class TestMain:
    @mock.patch("src.worker.handle_work")
    def test_runs_until_shutdown_requested(self, mock_handle_work, mocked_aws):
        mock_ShutdownHandler = mock.Mock(spec=ShutdownHandler)
        mock_ShutdownHandler.return_value.is_shutdown_requested.side_effect = [
            False,
            False,
            False,
            True,
        ]
        with mock.patch("src.worker.ShutdownHandler", mock_ShutdownHandler):
            worker.main()
        assert mock_handle_work.call_count == 3


class TestBuildDownloadURL:
    @pytest.mark.parametrize(
        ("base_url", "expected"),
        (
            (
                "example.com",
                "https://example.com/api/uploads/123/getFullFileExport",
            ),
            (
                "https://example.com",
                "https://example.com/api/uploads/123/getFullFileExport",
            ),
            (
                "https://example.com/some/prefix",
                "https://example.com/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "https://example.com/some/prefix/",
                "https://example.com/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "example.com/some/prefix",
                "https://example.com/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "example.com/some/prefix/",
                "https://example.com/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "example.com:443/some/prefix",
                "https://example.com:443/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "example.com:443/some/prefix/",
                "https://example.com:443/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "https://example.com:443/some/prefix",
                "https://example.com:443/some/prefix/api/uploads/123/getFullFileExport",
            ),
            (
                "https://example.com:443/some/prefix/",
                "https://example.com:443/some/prefix/api/uploads/123/getFullFileExport",
            ),
        ),
    )
    def test_base_url_normalization(self, base_url, expected):
        bare_endpoint = "api/uploads/123/getFullFileExport"

        assert expected == worker.build_url(base_url, endpoint=bare_endpoint), (
            "Unexpected result using endpoint without leading slash"
        )
        assert expected == worker.build_url(base_url, endpoint=f"/{bare_endpoint}"), (
            "Unexpected result using endpoint with leading slash"
        )

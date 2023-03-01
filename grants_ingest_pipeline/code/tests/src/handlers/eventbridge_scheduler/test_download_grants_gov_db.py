import datetime
from io import BytesIO
from unittest import mock

import pytest
import requests
import requests_mock

from src.handlers.eventbridge_scheduler import download_grants_gov_db


def test_handle():
    with mock.patch.object(download_grants_gov_db, 'stream_remote_file_to_s3') as mock_stream:
        download_grants_gov_db.handle({'timestamp': '2023-02-28T05:00:00-05:00'}, object())

    mock_stream.assert_called_once_with(
        source_url='http://example.gov/extract/GrantsDBExtract20230228v2.zip',
        destination_key='sources/2023/02/28/grants.gov/archive.zip',
        log_context={'db_date': datetime.date(2023, 2, 28)}
    )


def test_grants_url_for_date():
    test_date = datetime.date(2023, 2, 28)
    url = download_grants_gov_db.grants_url_for_date(test_date)

    assert url == 'http://example.gov/extract/GrantsDBExtract20230228v2.zip'


def test_object_key_for_date():
    test_date = datetime.date(2023, 2, 28)
    key = download_grants_gov_db.object_key_for_date(test_date)

    assert key == 'sources/2023/02/28/grants.gov/archive.zip'


class TestStreamRemoteFileTos3:
    def test_download_request_400(self):
        test_source_url = 'http://example.gov/extract/GrantsDBExtract20230228v2.zip'
        test_destination_key = 'sources/2023/02/28/grants.gov/archive.zip'

        with requests_mock.Mocker() as m:
            m.get(test_source_url, status_code=400)
            with mock.patch.object(
                download_grants_gov_db, 'grants_source_data_bucket'
            ) as mock_bucket:
                with pytest.raises(requests.HTTPError):
                    download_grants_gov_db.stream_remote_file_to_s3(
                        test_source_url, test_destination_key, {}
                    )
        mock_bucket.upload_fileobj.assert_not_called()

    def test_download_request_success(self):
        test_source_url = 'http://example.gov/extract/GrantsDBExtract20230228v2.zip'
        test_destination_key = 'sources/2023/02/28/grants.gov/archive.zip'
        with requests_mock.Mocker() as m:
            m.get(test_source_url, body=BytesIO(b'hi i am a zip file'))
            download_grants_gov_db.stream_remote_file_to_s3(
                test_source_url, test_destination_key, {}
            )
        new_object = BytesIO()
        download_grants_gov_db.grants_source_data_bucket.download_fileobj(
            test_destination_key, new_object
        )

        assert new_object.getvalue() == b'hi i am a zip file'


def test_make_transfer_callback():
    mock_logger = mock.Mock()
    cb = download_grants_gov_db.make_transfer_callback(mock_logger, {})
    cb(100)
    cb(500)

    assert mock_logger.debug.call_count == 2
    first_call_kwargs = mock_logger.debug.call_args_list[0][1]
    assert first_call_kwargs['extra']['chunk_size'] == 100
    assert first_call_kwargs['extra']['chunks_transferred'] == 1
    assert first_call_kwargs['extra']['cumulative_size'] == 100
    second_call_kwargs = mock_logger.debug.call_args_list[1][1]
    assert second_call_kwargs['extra']['chunk_size'] == 500
    assert second_call_kwargs['extra']['chunks_transferred'] == 2
    assert second_call_kwargs['extra']['cumulative_size'] == 600


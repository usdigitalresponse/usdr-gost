from __future__ import annotations

import copy
import typing
from unittest import mock

from src.lib import email

if typing.TYPE_CHECKING:
    import moto.ses.models


class TestEmail:
    def test_generate_email(self):
        test_zip_url = "https://example.org/your/download/is/here.zip"
        test_csv_url = "https://example.org/your/download/is/here.csv"
        email_html, email_text, subject = email.generate_email(
            archive_download_url=test_zip_url,
            metadata_download_url=test_csv_url,
        )
        assert test_zip_url in email_text
        assert test_zip_url in email_html
        assert test_csv_url in email_text
        assert test_csv_url in email_html
        assert "USDR Full File Export" == subject

    def test_send_email(self, ses, ses_sent_messages: list[moto.ses.models.Message]):
        email_html = "Test"
        email_text = "Test"
        subject = "Test"
        user_email = "foo@example.com"
        additional_tags = {"test_tag": "some_value"}

        with mock.patch(
            "src.lib.email.tag_ses_message", wraps=email.tag_ses_message
        ) as mock_tag_ses_message:
            message_id = email.send_email(
                email_client=ses,
                dest_email=user_email,
                email_html=email_html,
                email_text=email_text or "",
                subject=subject or "",
                additional_tags=additional_tags,
            )

        assert len(ses_sent_messages) == 1
        sent_message = ses_sent_messages[0]
        assert sent_message.id == message_id
        assert sent_message.body == email_html
        assert sent_message.source == email.NOTIFICATIONS_EMAIL_SENDER
        assert sent_message.destinations["ToAddresses"] == [user_email]
        mock_tag_ses_message.assert_called_once_with(
            mock.ANY, "full_file_export", **additional_tags
        )

    def test_tag_ses_message(self, monkeypatch):
        test_msg = {
            "Source": "sender@example.org",
            "Destination": {"ToAddresses": ["recipient@example.org"]},
            "Message": {
                "Subject": {"Charset": "UTF-8", "Data": "testing 123"},
                "Body": {
                    "Html": {
                        "Charset": "UTF-8",
                        "Data": "<html>content</html>",
                    },
                    "Text": {"Charset": "UTF-8", "Data": "content"},
                },
            },
        }
        test_original_msg_copy = copy.deepcopy(test_msg)
        for k, v in {
            "DD_SERVICE": "my-service",
            "DD_ENV": "testing",
            "DD_VERSION": "test",
        }.items():
            monkeypatch.setenv(k, v)
        tagged_msg = email.tag_ses_message(
            test_msg, "some_fake_notification", **{"something": "else"}
        )

        # Ensure parameter dict was both returned and modified in-place
        assert test_msg is tagged_msg

        # Ensure expected tags were added
        tags_result = tagged_msg["Tags"]
        assert {"Name": "service", "Value": "my-service"} in tags_result
        assert {"Name": "env", "Value": "testing"} in tags_result
        assert {"Name": "version", "Value": "test"} in tags_result
        assert {
            "Name": "notification_type",
            "Value": "some_fake_notification",
        } in tags_result
        assert {"Name": "something", "Value": "else"} in tags_result

        # Ensure starting message params are unmodified
        for expect_key, expect_val in test_original_msg_copy.items():
            assert expect_key in tagged_msg.keys(), (
                "message parameter unexpectedly missing after tagging"
            )
            assert expect_val == tagged_msg[expect_key], (
                "message parameter value unexpectedly modified after tagging"
            )

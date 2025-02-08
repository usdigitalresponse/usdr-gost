from __future__ import annotations

import os
import typing
import urllib

from src.lib import email

if typing.TYPE_CHECKING:
    import moto.ses.models


class TestEmail:
    def test_generate_email(self):
        test_download_url = "https://example.org/your/download/is/here.zip"
        email_html, email_text, subject = email.generate_email(
            download_url=test_download_url,
        )
        assert test_download_url in email_text
        assert urllib.parse.quote(test_download_url) in email_html
        assert "USDR Full File Export" == subject

    def test_send_email(self, ses, ses_sent_messages: list[moto.ses.models.Message]):
        email_html = "Test"
        email_text = "Test"
        subject = "Test"
        user_email = "foo@example.com"

        message_id = email.send_email(
            email_client=ses,
            dest_email=user_email,
            email_html=email_html,
            email_text=email_text or "",
            subject=subject or "",
        )

        assert len(ses_sent_messages) == 1
        sent_message = ses_sent_messages[0]
        assert sent_message.id == message_id
        assert sent_message.body == email_html
        assert sent_message.source == os.environ["NOTIFICATIONS_EMAIL"]
        assert sent_message.destinations["ToAddresses"] == [user_email]

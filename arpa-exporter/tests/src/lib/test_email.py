import os
from moto import mock_aws
import structlog
import boto3

from src.lib import email

class TestEmail:
    def test_generate_email(self):
        email_html, email_text, subject = email.generate_email(
            logger=structlog.get_logger(),
            url="https://example.com",
        )
        assert 'https://example.com' in email_html
        assert 'https://example.com' in email_text
        assert 'USDR Full File Export' == subject

    @mock_aws
    def test_send_email(self):
        os.environ["NOTIFICATIONS_EMAIL"] = "grants-notifications@usdigitalresponse.org"

        email_client = boto3.client("ses")

        # Verify the email address otherwise SES will throw an error
        email_client.verify_email_address(EmailAddress=os.getenv("NOTIFICATIONS_EMAIL"))

        email_html = "Test"
        email_text = "Test"
        subject = "Test"
        user_email = "foo@example.com"
        logger = structlog.get_logger()

        email.send_email(
            email_client=email_client,
            dest_email=user_email,
            email_html=email_html,
            email_text=email_text or "",
            subject=subject or "",
            logger=logger,
        )
        send_quota = email_client.get_send_quota()
        sent_count = int(send_quota["SentLast24Hours"])
        assert sent_count == 1

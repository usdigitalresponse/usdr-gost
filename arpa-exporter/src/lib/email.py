
from typing import Tuple, Optional

import chevron
import structlog
import os
import boto3
from botocore.exceptions import ClientError

EMAIL_HTML = """
Your full file export can be downloaded <a href={url}>here</a>.
"""

EMAIL_TEXT = """
Hello,
Your full file export can be downloaded here: {url}.
"""
CHARSET = "UTF-8"

def generate_email(
    logger: structlog.stdlib.BoundLogger,
    url: str = "",
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    try:
        with open("src/static/email_templates/formatted_body.html") as g:
            email_body = chevron.render(
                g,
                {
                    "body_title": "Hello,",
                    "body_detail": EMAIL_HTML.format(url=url),
                },
            )
            with open("src/static/email_templates/base.html") as f:
                email_html = chevron.render(
                    f,
                    {
                        "tool_name": "ARPA Reporter",
                        "title": "Full File Export",
                        "preheader": False,
                        "webview_available": False,
                        "base_url_safe": "",
                        "usdr_logo_url": "https://grants.usdigitalresponse.org/usdr_logo_transparent.png",
                        "presigned_url": url,
                        "notifications_url_safe": False,
                        "email_body": email_body,
                    },
                    partials_dict={
                        "email_body": email_body,
                    },
                )
                email_text = EMAIL_TEXT.format(url=url)
                subject = "USDR Full File Export"
                return email_html, email_text, subject
    except Exception as e:
        logger.error(f"Failed to generate full file export email: {e}")
    return None, None, None


def send_email(
    email_client,
    dest_email: str,
    email_html: str,
    email_text: str,
    subject: str,
    logger: structlog.stdlib.BoundLogger,
) -> bool:
    # Try to send the email.
    try:
        # Provide the contents of the email.
        response = email_client.send_email(
            Destination={
                "ToAddresses": [
                    dest_email,
                ],
            },
            Message={
                "Body": {
                    "Html": {
                        "Charset": CHARSET,
                        "Data": email_html,
                    },
                    "Text": {
                        "Charset": CHARSET,
                        "Data": email_text,
                    },
                },
                "Subject": {
                    "Charset": CHARSET,
                    "Data": subject,
                },
            },
            Source=os.getenv("NOTIFICATIONS_EMAIL"),
        )
    # Display an error if something goes wrong.
    except ClientError as e:
        error = e.response.get("Error") or {}
        message = error.get("Message")
        logger.error(message)
        return False
    else:
        logger.info("Email sent! Message ID:")
        logger.info(response["MessageId"])
    return True

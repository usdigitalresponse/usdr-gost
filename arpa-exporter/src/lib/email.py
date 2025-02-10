"""
Email template structure:

    ```
    <<Level 1: base.html>>
        (Common parameterized elements go here)
        <<Level 2: formatted_body.html>>
            Title param value
            <<Level 3: inner body text (or more HTML)>>
    ```

Each inner level is rendered and provided as a parameter ("partial") of its outer level.
Arguably, levels 1 & 2 should be combined in the arpa-exporter project, but we are
deferring to conventions established elsewhere.
"""

from __future__ import annotations

import os
import typing
import urllib

import chevron

if typing.TYPE_CHECKING:  # pragma: nocover
    from mypy_boto3_ses import SESClient

CHARSET = "UTF-8"
TEMPLATES_DIR = os.path.abspath("src/static/email_templates")
NOTIFICATIONS_EMAIL = os.environ["NOTIFICATIONS_EMAIL"]


def generate_email(
    download_url: str,
) -> typing.Tuple[str, str, str]:
    """Generates content to send for a notification email, informing the recipient
    that a zip file is ready to download.

    Args:
        download_url: The URL where the downloadable zip file is hosted.
            This should generally be a presigned S3 object URL.

    Returns:
        A 3-tuple containing (email_html, email_plaintext, subject), where:
            email_html: Generated HTML content for the email body
            email_plaintext: Generated alternative plaintext content for email
                clients that do not support HTML
            subject: Subject line to use when sending the email
    """
    # Level 3:
    with open(os.path.join(TEMPLATES_DIR, "messages", "full_file_export.html")) as tpl:
        message_html = chevron.render(tpl, {"url": urllib.parse.quote(download_url)})

    # Level 2:
    with open(os.path.join(TEMPLATES_DIR, "formatted_body.html")) as tpl:
        formatted_body_html = chevron.render(
            tpl, {"body_title": "Hello,", "body_detail": message_html}
        )

    # Level 1:
    with open(os.path.join(TEMPLATES_DIR, "base.html")) as tpl:
        email_html = chevron.render(
            tpl,
            {
                "tool_name": "ARPA Reporter",
                "title": "Full File Export",
                "usdr_logo_url": "https://grants.usdigitalresponse.org/usdr_logo_transparent.png",
            },
            partials_dict={"email_body": formatted_body_html},
        )

    # Alternate plaintext content
    with open(os.path.join(TEMPLATES_DIR, "messages", "full_file_export.txt")) as tpl:
        email_plaintext = chevron.render(tpl, {"url": download_url})

    subject = "USDR Full File Export"
    return email_html, email_plaintext, subject


def send_email(
    email_client: SESClient,
    dest_email: str,
    email_html: str,
    email_text: str,
    subject: str,
) -> str:
    """Sends an email to a single recipient via SES.

    Args:
        email_client: SES client for sending the email.
        dest_email: Email address of the intended recipient (a ``TO`` destination address).
        email_html: Rich HTML content generated for the email body.
        email_text: Alternative plaintext content generated for the email body
            (for compatibility with recipient email clients that do not support HTML).
        subject: Subject line for the outgoing email.

    Returns:
        The SES message ID generated for the outgoing email.
    """
    response = email_client.send_email(
        Source=NOTIFICATIONS_EMAIL,
        Destination={"ToAddresses": [dest_email]},
        Message={
            "Subject": {
                "Charset": CHARSET,
                "Data": subject,
            },
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
        },
    )
    return response["MessageId"]

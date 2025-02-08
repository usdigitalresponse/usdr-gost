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

import os
import urllib
from typing import Optional, Tuple

import chevron

CHARSET = "UTF-8"
TEMPLATES_DIR = os.path.abspath("src/static/email_templates")


def generate_email(
    download_url: str,
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
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
    email_client,
    dest_email: str,
    email_html: str,
    email_text: str,
    subject: str,
) -> bool:
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
    return response["MessageId"]

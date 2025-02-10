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

Note:
    This module provides a CLI interface for testing email generation.
    When run, it will generate sample email content and, depending on the provided options,
    sends the email using SMTP and/or writes html and/or plaintext content to a file.
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


def _main():  # pragma: nocover
    """Runs a command-line interface for debugging email content generation.

    Returns:
        Exit code for the process. ``1`` if any error(s) occurred, else ``0``.
    """
    import argparse
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    from src.lib.logging import get_logger

    parser = argparse.ArgumentParser(
        prog=f"python -m {__loader__.name}",
        description="CLI tool for debugging email content generation.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        help="Raise exception tracebacks",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "-u",
        "--url",
        help="URL for the downloadable S3 object to include in generated email content",
        default="https://s3.example.com/fake-bucket/not-a-real-key.zip",
    )
    parser.add_argument(
        "--host",
        help="Hostname (e.g. for mailpit) where SMTP will connect when sending",
        default="localhost",
    )
    parser.add_argument(
        "--port",
        help="Localhost port (e.g. for mailpit) where SMTP will connect when sending",
        type=int,
        default=1025,
    )
    parser.add_argument(
        "--no-send",
        help="If provided, skips sending the email over SMTP",
        action="store_true",
    )
    parser.add_argument(
        "--html",
        help="(Optional) Filename to save HTML email content",
        metavar="FILENAME",
        type=argparse.FileType("w"),
    )
    parser.add_argument(
        "--text",
        help="(Optional) Filename to save plaintext email content",
        metavar="FILENAME",
        type=argparse.FileType("w"),
    )

    args = parser.parse_args()
    log_fn = get_logger().error
    if args.verbose:
        log_fn = get_logger().exception

    try:
        html, plaintext, subject = generate_email(args.url)
    except:  # noqa: E722
        log_fn("Error generating email")
        return 1

    exit_code = 0
    if not args.no_send:
        message = MIMEMultipart("alternative")
        message["From"] = NOTIFICATIONS_EMAIL
        message["To"] = "test@example.com"
        message["Subject"] = subject
        message.attach(MIMEText(plaintext, "plain"))
        message.attach(MIMEText(html, "html"))
        try:
            smtplib.SMTP(args.host, args.port).send_message(message)
            get_logger().info("Email sent", host=args.host, port=args.port)
        except:  # noqa: E722
            log_fn("Error sending email")
            exit_code = 1

    if args.html:
        try:
            args.html.write(html)
            get_logger().info(
                "Email HTML content written to file", filename=args.html.name
            )
        except:  # noqa: E722
            log_fn("Error writing email HTML content to file", filename=args.html.name)
            exit_code = 1
    if args.text:
        try:
            args.text.write(plaintext)
            get_logger().info(
                "Email plaintext content written to file", filename=args.text.name
            )
        except:  # noqa: E722
            log_fn(
                "Error writing email plaintext content to file", filename=args.text.name
            )
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    exit(_main())

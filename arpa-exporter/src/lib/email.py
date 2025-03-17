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

import chevron
from ddtrace import tracer

if typing.TYPE_CHECKING:  # pragma: nocover
    from mypy_boto3_ses import SESClient
    from mypy_boto3_ses.type_defs import SendEmailRequestTypeDef

CHARSET = "UTF-8"
TEMPLATES_DIR = os.path.abspath("src/static/email_templates")
DEFAULT_CONFIGURATION_SET_NAME = os.getenv("SES_CONFIGURATION_SET_DEFAULT")
NOTIFICATIONS_EMAIL = os.environ["NOTIFICATIONS_EMAIL"]
NOTIFICATIONS_EMAIL_DISPLAY_NAME = os.getenv(
    "NOTIFICATIONS_EMAIL_DISPLAY_NAME", "USDR ARPA Reporter"
)
NOTIFICATIONS_EMAIL_SENDER = (
    f"{NOTIFICATIONS_EMAIL_DISPLAY_NAME} <{NOTIFICATIONS_EMAIL}>"
)


def generate_email(
    archive_download_url: str,
    metadata_download_url: str,
) -> typing.Tuple[str, str, str]:
    """Generates content to send for a notification email, informing the recipient
    that a zip file is ready to download.

    Args:
        archive_download_url: The URL where the downloadable zip file is hosted.
            This should generally be a presigned S3 object URL.
        metadata_download_url: The URL where a downloadable file providing a manifest
            of the contents of the file available at ``archive_download_url``

    Returns:
        A 3-tuple containing (email_html, email_plaintext, subject), where:
            email_html: Generated HTML content for the email body
            email_plaintext: Generated alternative plaintext content for email
                clients that do not support HTML
            subject: Subject line to use when sending the email
    """
    # Level 3:
    with open(os.path.join(TEMPLATES_DIR, "messages", "full_file_export.html")) as tpl:
        message_html = chevron.render(
            tpl,
            {
                "zip_url": archive_download_url,
                "csv_url": metadata_download_url,
            },
        )

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
        email_plaintext = chevron.render(
            tpl,
            {
                "zip_url": archive_download_url,
                "csv_url": metadata_download_url,
            },
        )

    subject = "USDR Full File Export"
    return email_html, email_plaintext, subject


def tag_ses_message(
    message: SendEmailRequestTypeDef,
    notification_type: str,
    **extra: typing.Any,
) -> SendEmailRequestTypeDef:
    """Adds/updates the "Tags" param on configuration for an outgoing SES message
    with the (gost-standard) ``notification_type`` tag and any given ``extra``
    key/value pairs.

    The following tags are conditionally added for observability:
    - ``dd_trace_id`` and ``dd_span_id`` are added if a trace is active at call-time
    - Universal service monitoring tags ``service``, ``env``, and ``version``
        from ``DD_SERVICE``, ``DD_ENV``, and ``DD_VERSION`` environment variables,
        respectively, as long as the corresponding env var is defined.

    Notes:
        - When a tag that is automatically added by this function has the same name
            as a tag provided as a keyword argument in ``**extra``,
            the value provided for the keyword argument takes precedence.
        - The given ``message`` dict is both updated in-place and returned
            by this function.

    Args:
        message: Configuration parameters for calling ``SESClient.send_email()``.
        notification_type: The name of this email notification, i.e. which disambiguates
            email events for Full-File Export emails from others sent on behalf
            of the gost service.
        **extra: Additional key/value pairs that represent the name and value of a tag.
            Values can be any type but will be cast to ``str`` when used as a tag value.

    Returns:
        The config dict of parameters provided in the ``message`` argument,
            updated with new tag definitions.
    """
    tags: dict[str, typing.Any] = {"notification_type": notification_type}
    if span := tracer.current_span():
        tags.update(dd_trace_id=span.trace_id, dd_span_id=span.span_id)
    tags.update(
        **{
            k: v
            for k, v in {
                "service": os.getenv("DD_SERVICE"),
                "env": os.getenv("DD_ENV"),
                "version": os.getenv("DD_VERSION"),
            }.items()
            if v is not None
        }
    )
    tags.update(**extra)
    ses_tags = list(message.get("Tags", []))
    ses_tags += [{"Name": k, "Value": str(v)} for k, v in tags.items()]
    message["Tags"] = ses_tags
    return message


def send_email(
    email_client: SESClient,
    dest_email: str,
    email_html: str,
    email_text: str,
    subject: str,
    additional_tags: typing.Optional[dict[str, typing.Any]] = None,
) -> str:
    """Sends an email to a single recipient via SES.

    Args:
        email_client: SES client for sending the email.
        dest_email: Email address of the intended recipient (a ``TO`` destination address).
        email_html: Rich HTML content generated for the email body.
        email_text: Alternative plaintext content generated for the email body
            (for compatibility with recipient email clients that do not support HTML).
        subject: Subject line for the outgoing email.
        additional_tags: Key/value pairs to add as tags on the outgoing SES email.

    Returns:
        The SES message ID generated for the outgoing email.
    """
    message: SendEmailRequestTypeDef = {
        "Source": NOTIFICATIONS_EMAIL_SENDER,
        "Destination": {"ToAddresses": [dest_email]},
        "Message": {
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
    }

    if DEFAULT_CONFIGURATION_SET_NAME:
        message["ConfigurationSetName"] = DEFAULT_CONFIGURATION_SET_NAME

    response = email_client.send_email(
        **tag_ses_message(message, "full_file_export", **additional_tags or {})
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
        prog=f"python -m {__loader__.name}",  # type: ignore[name-defined]
        description="CLI tool for debugging email content generation.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        help="If provided, includes exception tracebacks in error log output",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--zip-url",
        help="URL for the zip file download link to include in generated email content (default: %(default)s)",
        default="https://example.com/path/to/archive.zip",
    )
    parser.add_argument(
        "--csv-url",
        help="URL for the csv file download link to include in generated email content (default: %(default)s)",
        default="https://example.com/path/to/metadata.csv",
    )
    parser.add_argument(
        "--host",
        help="Hostname (e.g. for mailpit) where SMTP will connect when sending (default: %(default)s)",
        default="localhost",
    )
    parser.add_argument(
        "--port",
        help="Localhost port (e.g. for mailpit) where SMTP will connect when sending (default: %(default)s)",
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
        help="(Optional) Filename to save generated HTML email content",
        metavar="FILENAME",
        type=argparse.FileType("w"),
    )
    parser.add_argument(
        "--text",
        help="(Optional) Filename to save generated plaintext email content",
        metavar="FILENAME",
        type=argparse.FileType("w"),
    )

    args = parser.parse_args()
    log_fn = get_logger().error
    if args.verbose:
        log_fn = get_logger().exception

    try:
        html, plaintext, subject = generate_email(args.zip_url, args.csv_url)
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
                "Email HTML content written to file",
                filename=args.html.name,
            )
        except:  # noqa: E722
            log_fn("Error writing email HTML content to file", filename=args.html.name)
            exit_code = 1

    if args.text:
        try:
            args.text.write(plaintext)
            get_logger().info(
                "Email plaintext content written to file",
                filename=args.text.name,
            )
        except:  # noqa: E722
            log_fn(
                "Error writing email plaintext content to file",
                filename=args.text.name,
            )
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    exit(_main())

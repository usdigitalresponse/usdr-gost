import os

import boto3
import moto
import moto.core
import moto.ses
import moto.ses.models
import pytest

os.environ.setdefault("TASK_QUEUE_URL", "https://example.com/queue")
os.environ.setdefault("TASK_QUEUE_RECEIVE_TIMEOUT", "1")
os.environ.setdefault(
    "DATA_DIR",
    f"{os.path.dirname(os.path.abspath(__file__))}/fixtures/data",
)
os.environ.setdefault(
    "NOTIFICATIONS_EMAIL", "grants-notifications@usdigitalresponse.org"
)
os.environ.setdefault("API_DOMAIN", "https://api.example.org")

# Configure mock AWS SDK and fixtures
AWS_REGION = "us-west-2"


@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION
    os.environ["AWS_REGION"] = AWS_REGION
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"


@pytest.fixture(scope="function")
def mocked_aws(aws_credentials):
    """
    Mock all AWS interactions
    Requires you to create your own boto3 clients
    """
    with moto.mock_aws():
        yield


@pytest.fixture(scope="function")
def s3(mocked_aws):
    yield boto3.client("s3")


@pytest.fixture(scope="function")
def sqs(mocked_aws):
    yield boto3.client("sqs")


@pytest.fixture(scope="function")
def ses(mocked_aws):
    client = boto3.client("ses")
    # Verify the email address otherwise SES will throw an error
    client.verify_email_identity(EmailAddress=os.environ["NOTIFICATIONS_EMAIL"])
    yield client


@pytest.fixture(scope="function")
def ses_current_backend(ses):
    account_backends = moto.ses.models.ses_backends[moto.core.DEFAULT_ACCOUNT_ID]
    current_backend: moto.ses.models.SESBackend = account_backends[AWS_REGION]
    yield current_backend


@pytest.fixture(scope="function")
def ses_sent_messages(ses_current_backend) -> list[moto.ses.models.Message]:  # type: ignore
    yield ses_current_backend.sent_messages

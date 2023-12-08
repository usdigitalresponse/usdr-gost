#!/bin/bash

export LOCALSTACK_HOST=localhost
export HOSTNAME_EXTERNAL=localstack
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"

VALID_EMAILS=(
  "grants-identification@usdigitalresponse.org"
)

for email in "${VALID_EMAILS[@]}"; do
  awslocal ses verify-email-identity --email-address ${email}
  echo "Verified ${email} to send with localstack SES"
done

awslocal s3api create-bucket --bucket arpa-audit-reports --region us-west-2 --create-bucket-configuration '{"LocationConstraint": "us-west-2"}'

awslocal sqs create-queue --queue-name grants-ingest-events
awslocal sqs create-queue --queue-name arpa-queue

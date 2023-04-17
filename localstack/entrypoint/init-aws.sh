#! /bin/bash

export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-west-2"

VALID_EMAILS=(
  "grants-identification@usdigitalresponse.org"
)

for email in "${VALID_EMAILS[@]}"; do
  awslocal ses verify-email-identity --email-address ${email}
  echo "Verified ${email} to send with localstack SES"
done

awslocal s3api create-bucket --bucket arpa-audit-reports --region us-west-2 --create-bucket-configuration '{"LocationConstraint": "us-west-2"}'

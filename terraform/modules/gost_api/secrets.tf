data "aws_kms_key" "ssm" {
  key_id = "alias/aws/ssm"
}

resource "random_password" "cookie_secret" {
  length = 16
}

resource "aws_ssm_parameter" "cookie_secret" {
  count = var.enabled ? 1 : 0

  name        = "${var.ssm_path_prefix}/api/cookie_secret"
  description = "Secret value used to sign cookies."
  type        = "SecureString"
  key_id      = data.aws_kms_key.ssm.arn
  value       = random_password.cookie_secret.result
}

resource "aws_ssm_parameter" "postgres_connection_string" {
  count = var.enabled ? 1 : 0

  name        = "${var.ssm_path_prefix}/postgres/connection_string"
  description = "Connection string for the postgres database."
  type        = "SecureString"
  key_id      = data.aws_kms_key.ssm.arn

  value = format(
    # e.g. "postgres://user@endpoint:port/dbname"
    "postgres://%s@%s:%s/%s",
    var.postgres_username,
    var.postgres_password,
    var.postgres_endpoint,
    var.postgres_port,
    var.postgres_db_name
  )
}

data "aws_ssm_parameter" "datadog_api_key" {
  count = var.enabled ? 1 : 0

  name = "${var.ssm_path_prefix}/datadog/api_key"
}

module "decrypt_secrets_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"
  context = module.this.context

  name = "decrypt-secrets"

  iam_policy_statements = {
    DecryptWithKMS = {
      effect = "Allow"
      actions = [
        "kms:Decrypt",
      ]
      resources = [
        data.aws_kms_key.ssm.arn,
      ]
    }
    GetSecretParameters = {
      effect = "Allow"
      actions = [
        "ssm:GetParameters",
        "secretsmanager:GetSecretValue",
      ]
      resources = compact([
        join("", data.aws_ssm_parameter.datadog_api_key.*.arn),
        join("", aws_ssm_parameter.postgres_connection_string.*.arn),
        join("", aws_ssm_parameter.cookie_secret.*.arn),
      ])
    }
  }
}

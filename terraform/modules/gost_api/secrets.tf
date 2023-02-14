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
    # e.g. "postgres://user:pass@endpoint:port/dbname"
    "postgres://%s:%s@%s:%s/%s",
    var.postgres_username,
    var.postgres_password,
    var.postgres_endpoint,
    var.postgres_port,
    var.postgres_db_name
  )
}

resource "aws_ssm_parameter" "datadog_api_key" {
  count = var.enabled && var.datadog_api_key != "" ? 1 : 0

  name        = "/datadog/api_key"
  description = "Datadog API key."
  type        = "SecureString"
  key_id      = local.datadog_api_key_kms_key_arn

  value = var.datadog_api_key
}

locals {
  datadog_api_key_parameter_arn = coalesce(
    var.datadog_api_key_parameter_arn,
    join("", aws_ssm_parameter.datadog_api_key.*.arn)
  )
  datadog_api_key_kms_key_arn = coalesce(
    var.datadog_api_key_parameter_kms_key_arn,
    data.aws_kms_key.ssm.arn
  )
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
      resources = distinct([
        data.aws_kms_key.ssm.arn,
        local.datadog_api_key_kms_key_arn,
      ])
    }
    GetSecretParameters = {
      effect = "Allow"
      actions = [
        "ssm:GetParameters",
        "secretsmanager:GetSecretValue",
      ]
      resources = compact([
        local.datadog_api_key_parameter_arn,
        join("", aws_ssm_parameter.postgres_connection_string.*.arn),
        join("", aws_ssm_parameter.cookie_secret.*.arn),
      ])
    }
  }
}

terraform {
  required_version = "1.3.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.55.0"
    }
  }

  backend "s3" {}
}

data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

locals {
  permissions_boundary_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${var.permissions_boundary_policy_name}"

  datadog_layer_arn_prefix = join(":", [
    "arn",
    data.aws_partition.current.id,
    "lambda",
    data.aws_region.current.name,
    { aws = "464622532012", aws-us-gov = "002406178527" }[data.aws_partition.current.id],
    "layer",
  ])
  datadog_python_library_layer_arn = "${local.datadog_layer_arn_prefix}:Python39:68"
  datadog_nodejs_library_layer_arn = "${local.datadog_layer_arn_prefix}:Node18-x:68"
  datadog_extension_layer_arn      = "${local.datadog_layer_arn_prefix}:Datadog-Extension:38"
}

module "this" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  enabled   = var.enabled
  namespace = var.namespace
  tags      = var.tags
}

module "s3_label" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  context = module.this.context
  attributes = [
    data.aws_caller_identity.current.account_id,
    data.aws_region.current.name,
  ]
}

module "lambda_artifacts_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.0.0"
  context = module.s3_label.context
  name    = "lambda_artifacts"

  acl                          = "private"
  versioning_enabled           = true
  sse_algorithm                = "AES256"
  allow_ssl_requests_only      = true
  allow_encrypted_uploads_only = true
  source_policy_documents      = []

  lifecycle_configuration_rules = [
    {
      enabled                                = true
      id                                     = "rule-1"
      filter_and                             = null
      abort_incomplete_multipart_upload_days = 7
      transition                             = [{ days = null }]
      expiration                             = { days = null }
      noncurrent_version_transition = [
        {
          days          = 30
          storage_class = "GLACIER"
        },
      ]
      noncurrent_version_expiration = {
        days = 90
      }
    }
  ]
}

module "grants_source_data_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.0.0"
  context = module.s3_label.context
  name    = "grants_source_data"

  acl                          = "private"
  versioning_enabled           = true
  sse_algorithm                = "AES256"
  allow_ssl_requests_only      = true
  allow_encrypted_uploads_only = true
  source_policy_documents      = []

  lifecycle_configuration_rules = [
    {
      enabled                                = true
      id                                     = "rule-1"
      filter_and                             = null
      abort_incomplete_multipart_upload_days = 1
      transition                             = [{ days = null }]
      expiration                             = { days = null }
      noncurrent_version_transition = [
        {
          days          = 30
          storage_class = "GLACIER"
        },
      ]
      noncurrent_version_expiration = {
        days = 2557 # 7 years (includes 2 leap days)
      }
    }
  ]
}

module "grants_prepared_data_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.0.0"
  context = module.s3_label.context
  name    = "grants_prepared_data"

  acl                          = "private"
  versioning_enabled           = true
  sse_algorithm                = "AES256"
  allow_ssl_requests_only      = true
  allow_encrypted_uploads_only = true
  source_policy_documents      = []

  lifecycle_configuration_rules = [
    {
      enabled                                = true
      id                                     = "rule-1"
      filter_and                             = null
      abort_incomplete_multipart_upload_days = 1
      transition                             = [{ days = null }]
      expiration                             = { days = null }
      noncurrent_version_transition = [
        {
          days          = 30
          storage_class = "GLACIER"
        },
      ]
      noncurrent_version_expiration = {
        days = 2557 # 7 years (includes 2 leap days)
      }
    }
  ]
}

resource "aws_scheduler_schedule_group" "default" {
  count = var.eventbridge_scheduler_enabled ? 1 : 0

  name = var.namespace
}

data "aws_ssm_parameter" "datadog_api_key_secret_arn" {
  count = var.datadog_enabled ? 1 : 0

  name = "${var.ssm_deployment_parameters_path_prefix}/datadog/api_key_secret_arn"
}

data "aws_iam_policy_document" "read_datadog_api_key_secret" {
  count = var.datadog_enabled ? 1 : 0

  statement {
    sid       = "GetDatadogAPIKeySecretValue"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = data.aws_ssm_parameter.datadog_api_key_secret_arn.*.value
  }
}

// Lambda defaults
locals {
  lambda_environment_variables = merge(
    !var.datadog_enabled ? {} : {
      DD_API_KEY_SECRET_ARN        = join("", data.aws_ssm_parameter.datadog_api_key_secret_arn.*.value)
      DD_APM_ENABLED               = "true"
      DD_CAPTURE_LAMBDA_PAYLOAD    = "true"
      DD_ENV                       = var.datadog_tags.DD_ENV
      DD_SERVERLESS_APPSEC_ENABLED = "true"
      DD_SERVICE                   = var.datadog_tags.DD_SERVICE
      DD_SITE                      = "datadoghq.com"
      DD_TRACE_ENABLED             = "true"
      DD_TRACE_SAMPLE_RATE         = "1.000"
      DD_VERSION                   = coalesce(var.datadog_tags.DD_VERSION, "dev")
    },
    {
      TZ = "UTC"
    }
  )
  lambda_execution_policies = compact([
    join("", data.aws_iam_policy_document.read_datadog_api_key_secret.*.json)
  ])
  lambda_layer_arns = compact([
    var.datadog_enabled ? local.datadog_extension_layer_arn : ""
  ])
}

// Modules providing Lambda functions
module "download_grants_gov_db" {
  source = "./modules/download_grants_gov_db"

  namespace                                    = var.namespace
  permissions_boundary_arn                     = local.permissions_boundary_arn
  lambda_artifact_bucket                       = module.lambda_artifacts_bucket.bucket_id
  log_retention_in_days                        = var.lambda_default_log_retention_in_days
  log_level                                    = var.lambda_default_log_level
  lambda_code_path                             = "${path.module}/code"
  additional_environment_variables             = local.lambda_environment_variables
  additional_lambda_execution_policy_documents = local.lambda_execution_policies
  lambda_layer_arns                            = local.lambda_layer_arns

  scheduler_group_name           = join("", aws_scheduler_schedule_group.default.*.name)
  grants_source_data_bucket_name = module.grants_source_data_bucket.bucket_id
  eventbridge_scheduler_enabled  = var.eventbridge_scheduler_enabled
}

module "split_grants_gov_db" {
  source = "./modules/split_grants_gov_xml_db"

  namespace                                    = var.namespace
  permissions_boundary_arn                     = local.permissions_boundary_arn
  lambda_artifact_bucket                       = module.lambda_artifacts_bucket.bucket_id
  log_retention_in_days                        = var.lambda_default_log_retention_in_days
  log_level                                    = var.lambda_default_log_level
  lambda_code_path                             = "${path.module}/code"
  additional_environment_variables             = local.lambda_environment_variables
  additional_lambda_execution_policy_documents = local.lambda_execution_policies
  lambda_layer_arns                            = local.lambda_layer_arns

  grants_source_data_bucket_name   = module.grants_source_data_bucket.bucket_id
  grants_prepared_data_bucket_name = module.grants_prepared_data_bucket.bucket_id
}

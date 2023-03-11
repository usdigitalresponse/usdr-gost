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
  ])
  datadog_python_library_layer_arn = "${local.datadog_layer_arn_prefix}:Python39:68"
  datadog_nodejs_library_layer_arn = "${local.datadog_layer_arn_prefix}:Node18-x:68"
  datadog_extension_layer_arn      = "${local.datadog_layer_arn_prefix}:Datadog-Extension:38"
  datadog_python_layers            = var.datadog_enabled ? [local.datadog_python_library_layer_arn, local.datadog_extension_layer_arn] : []
  datadog_nodejs_layers            = var.datadog_enabled ? [local.datadog_nodejs_library_layer_arn, local.datadog_extension_layer_arn] : []
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

module "download_grants_gov_db" {
  source = "./modules/download_grants_gov_db"

  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn
  lambda_artifact_bucket   = module.lambda_artifacts_bucket.bucket_id
  log_retention_in_days    = var.lambda_default_log_retention_in_days
  log_level                = var.lambda_default_log_level
  lambda_code_path         = "${path.module}/code"

  scheduler_group_name           = join("", aws_scheduler_schedule_group.default.*.name)
  grants_source_data_bucket_name = module.grants_source_data_bucket.bucket_id
  eventbridge_scheduler_enabled  = var.eventbridge_scheduler_enabled
}

module "split_grants_gov_db" {
  source = "./modules/split_grants_gov_xml_db"

  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn
  lambda_artifact_bucket   = module.lambda_artifacts_bucket.bucket_id
  log_retention_in_days    = var.lambda_default_log_retention_in_days
  log_level                = var.lambda_default_log_level
  lambda_code_path         = "${path.module}/code/gosrc/grants_ingest_pipeline"

  grants_source_data_bucket_name   = module.grants_source_data_bucket.bucket_id
  grants_prepared_data_bucket_name = module.grants_prepared_data_bucket.bucket_id
}

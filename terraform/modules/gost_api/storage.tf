module "efs_data_volume" {
  source  = "cloudposse/efs/aws"
  version = "0.33.0"
  context = module.this.context

  name                       = "${var.namespace}-data_volume"
  region                     = data.aws_region.current.name
  vpc_id                     = var.vpc_id
  subnets                    = var.subnet_ids
  allowed_security_group_ids = var.security_group_ids

  access_points = {
    "data" = {
      posix_user = {
        uid = "1000"
        gid = "1000"
      }
      creation_info = {
        uid         = "1000"
        gid         = "1000"
        permissions = "0755"
      }
    }
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

module "s3_label" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  context = module.this.context
  attributes = [
    data.aws_caller_identity.current.account_id,
    data.aws_region.current.name,
  ]
}

module "arpa_audit_reports_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.0.0"
  context = module.s3_label.context
  name    = "arpa_audit_reports"

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
        days = 7
      }
    }
  ]
}

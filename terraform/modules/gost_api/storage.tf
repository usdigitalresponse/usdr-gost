module "efs_data_volume" {
  source  = "cloudposse/efs/aws"
  version = "0.34.0"
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

module "arpa_audit_reports_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.1.2"
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
      expiration                             = { days = 14 }
      transition                             = null
      noncurrent_version_expiration          = { days = 7 }
      noncurrent_version_transition          = null
    }
  ]
}

module "access_arpa_reports_bucket_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.0"
  context = module.s3_label.context

  name = "access_arpa_reports_bucket"

  iam_policy_statements = {
    ReadWriteBucketObjects = {
      effect = "Allow"
      actions = [
        "s3:PutObject",
        "s3:GetObject",
      ]
      resources = ["${module.arpa_audit_reports_bucket.bucket_arn}/*"]
    }
  }
}

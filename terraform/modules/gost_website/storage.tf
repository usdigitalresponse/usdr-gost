module "s3_label" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  context = module.this.context
  attributes = [
    data.aws_caller_identity.current.account_id,
    data.aws_region.current.name,
    "website"
  ]
}

locals {
  sync_website_to_origin_bucket_policy = {
    actions = [
      "s3:DeleteObject",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
    ]
    resources = [

      "${module.origin_bucket.bucket_arn}${var.origin_bucket_dist_path}/*",
    ]
  }
}

module "cloudfront_to_origin_bucket_access_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"
  context = module.s3_label.context

  iam_policy_statements = {
    S3GetObjectForCloudFront = {
      effect  = "Allow"
      actions = ["s3:GetObject"]
      resources = [
        "${module.origin_bucket.bucket_arn}${var.origin_bucket_dist_path}/*",
        "${module.origin_bucket.bucket_arn}${var.origin_bucket_config_path}/${var.origin_config_filename}",
      ]
      principals = [
        {
          type        = "AWS"
          identifiers = [aws_cloudfront_origin_access_identity.default.iam_arn]
        },
      ]
    }
    S3ListBucketForCloudFront = {
      effect    = "Allow"
      actions   = ["s3:ListBucket"]
      resources = [module.origin_bucket.bucket_arn]
      principals = [
        {
          type        = "AWS"
          identifiers = [aws_cloudfront_origin_access_identity.default.iam_arn]
        },
      ]
    }
  }
}

module "github_deploy_to_origin_bucket_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"
  context = module.s3_label.context

  iam_policy_statements = {
    S3GetObjectForCloudFront = {
      effect  = "Allow"
      actions = ["s3:GetObject"]
      resources = [
        "${module.origin_bucket.bucket_arn}${var.origin_bucket_dist_path}/*",
      ]
      principals = [
        {
          type        = "AWS"
          identifiers = [aws_cloudfront_origin_access_identity.default.iam_arn]
        },
      ]
    }
  }
}

module "origin_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.0.0"
  context = module.s3_label.context
  name    = "origin"

  acl                          = "private"
  versioning_enabled           = true
  sse_algorithm                = "AES256"
  allow_ssl_requests_only      = true
  allow_encrypted_uploads_only = true
  source_policy_documents = [
    module.cloudfront_to_origin_bucket_access_policy.json,
  ]
}

module "logs_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "3.0.0"
  context = module.s3_label.context
  name    = "logs"

  acl                          = "private"
  versioning_enabled           = false
  sse_algorithm                = "AES256"
  allow_ssl_requests_only      = true
  allow_encrypted_uploads_only = true

  lifecycle_configuration_rules = [
    {
      enabled                                = true
      id                                     = "rule-1"
      filter_and                             = null
      abort_incomplete_multipart_upload_days = 7
      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 60
          storage_class = "GLACIER"
        },
      ]
      expiration = {
        days = 90
      }
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

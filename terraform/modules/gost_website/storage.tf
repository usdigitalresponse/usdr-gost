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
}

module "cloudfront_to_origin_bucket_access_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "2.0.1"
  context = module.s3_label.context

  iam_policy = [
    {
      statements = [
        {
          sid     = "S3GetObjectForCloudFront"
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
        },
        {
          sid       = "S3ListBucketForCloudFront"
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
      ]
    }
  ]
}

module "github_deploy_to_origin_bucket_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "2.0.1"
  context = module.s3_label.context

  iam_policy = [
    {
      statements = [
        {
          sid     = "S3GetObjectForCloudFront"
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
      ]
    }
  ]
}

module "origin_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "4.7.1"
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

  lifecycle_configuration_rules = [
    {
      enabled                                = true
      id                                     = "rule-1"
      filter_and                             = null
      abort_incomplete_multipart_upload_days = 1
      expiration                             = null
      transition                             = null
      noncurrent_version_expiration          = { noncurrent_days = 7 }
      noncurrent_version_transition          = null
    }
  ]
}

locals {
  origin_artifacts_dist_path       = trimsuffix(var.origin_artifacts_dist_path, "/")
  origin_artifacts_dist_key_prefix = trim(var.origin_bucket_dist_path, "/")

  extension_mime_types = {
    bmp    = "image/bmp"
    css    = "text/css"
    csv    = "text/csv"
    gif    = "image/gif"
    htm    = "text/html"
    html   = "text/html"
    ico    = "image/vnd.microsoft.icon"
    jpeg   = "image/jpeg"
    jpg    = "image/jpeg"
    js     = "text/javascript"
    json   = "application/json"
    jsonld = "application/ld+json"
    map    = "application/json" # assumes .js.map
    otf    = "font/otf"
    pdf    = "application/pdf"
    png    = "image/png"
    svg    = "image/svg+xml"
    tif    = "image/tiff"
    tiff   = "image/tiff"
    ttf    = "font/ttf"
    txt    = "text/plain"
    woff   = "font/woff"
    woff2  = "font/woff2"
    xls    = "application/vnd.ms-excel"
    xlsx   = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    xml    = "application/xml"
    webp   = "image/webp"
  }
}

resource "aws_s3_object" "origin_dist_artifact" {
  for_each = fileset(local.origin_artifacts_dist_path, "**")

  bucket                 = module.origin_bucket.bucket_id
  key                    = "${local.origin_artifacts_dist_key_prefix}/${each.value}"
  source                 = "${local.origin_artifacts_dist_path}/${each.value}"
  source_hash            = filemd5("${local.origin_artifacts_dist_path}/${each.value}")
  etag                   = filemd5("${local.origin_artifacts_dist_path}/${each.value}")
  server_side_encryption = "AES256"
  content_type           = local.extension_mime_types[reverse(split(".", each.value))[0]]

  depends_on = [module.origin_bucket]
}

module "logs_bucket" {
  source  = "cloudposse/s3-bucket/aws"
  version = "4.7.1"
  context = module.s3_label.context
  name    = "logs"

  acl                          = "private"
  versioning_enabled           = var.logs_bucket_versioning
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
          noncurrent_days = 30
          storage_class   = "GLACIER"
        },
      ]
      noncurrent_version_expiration = {
        noncurrent_days = 90
      }
    }
  ]
}

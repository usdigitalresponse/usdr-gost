locals {
  deployConfigContents = templatefile(
    "${path.module}/tpl/deploy-config.js",
    {
      gost_api_domain = var.gost_api_domain
      feature_flags   = jsonencode(var.feature_flags)
      dd_rum_enabled  = var.datadog_rum_enabled
      dd_rum_config   = jsonencode(var.datadog_rum_config)
      google_tag_id   = var.google_tag_id
    }
  )
}

resource "aws_s3_object" "deploy-config" {
  count = var.enabled ? 1 : 0

  key                    = "${var.origin_bucket_config_path}/${var.origin_config_filename}"
  bucket                 = module.origin_bucket.bucket_id
  content                = local.deployConfigContents
  etag                   = md5(local.deployConfigContents)
  server_side_encryption = "AES256"
}

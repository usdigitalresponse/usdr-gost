resource "aws_cloudfront_origin_access_identity" "default" {
  comment = "GOST website access."
}

data "aws_cloudfront_cache_policy" "Managed-CachingOptimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_function" "arpa_reporter_uri_rewriter" {
  count = var.enabled ? 1 : 0

  name    = "${var.namespace}-arpa_reporter_uri_rewriter"
  comment = "Rewrites nested `/arpa_reporter` and `/arpa_reporter/*` URIs to be SPA-friendly."
  runtime = "cloudfront-js-1.0"
  publish = true

  code = templatefile(
    "${path.module}/tpl/uriRewriter.js",
    {
      matchRegex = "/^\\/arpa_reporter((\\/.*$)|$)/g"
      rewriteTo  = "/arpa_reporter/index.html"
    }
  )
}

module "cdn" {
  source              = "terraform-aws-modules/cloudfront/aws"
  version             = "3.2.1"
  create_distribution = var.enabled

  depends_on = [
    module.origin_bucket,
    module.logs_bucket,
    module.cloudfront_ssl_certificate,
  ]

  comment             = "GOST website CDN."
  enabled             = true
  aliases             = [var.domain_name]
  default_root_object = "index.html"
  web_acl_id          = module.waf.id

  // Optimized for North America
  // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PriceClass.html
  price_class = "PriceClass_100"

  logging_config = {
    bucket = module.logs_bucket.bucket_domain_name
  }

  create_origin_access_identity = false
  origin = {
    content = {
      domain_name = module.origin_bucket.bucket_domain_name
      origin_path = var.origin_bucket_dist_path
      s3_origin_config = {
        cloudfront_access_identity_path = aws_cloudfront_origin_access_identity.default.cloudfront_access_identity_path
      }
    }

    config = {
      domain_name = module.origin_bucket.bucket_domain_name
      origin_path = var.origin_bucket_config_path
      s3_origin_config = {
        cloudfront_access_identity_path = aws_cloudfront_origin_access_identity.default.cloudfront_access_identity_path
      }
    }
  }

  default_cache_behavior = {
    target_origin_id       = "content"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods      = ["GET", "HEAD", "OPTIONS"]
    cached_methods       = ["GET", "HEAD"]
    compress             = true
    cache_policy_id      = data.aws_cloudfront_cache_policy.Managed-CachingOptimized.id
    use_forwarded_values = false

    function_association = {
      viewer-request = {
        function_arn = join("", aws_cloudfront_function.arpa_reporter_uri_rewriter.*.arn)
      }
    }
  }

  ordered_cache_behavior = [
    {
      path_pattern           = "/${var.origin_config_filename}"
      target_origin_id       = "config"
      viewer_protocol_policy = "redirect-to-https"

      allowed_methods      = ["GET", "HEAD", "OPTIONS"]
      cached_methods       = ["GET", "HEAD"]
      compress             = true
      cache_policy_id      = data.aws_cloudfront_cache_policy.Managed-CachingOptimized.id
      use_forwarded_values = false
    },
  ]

  viewer_certificate = {
    acm_certificate_arn      = module.cloudfront_ssl_certificate.arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }
}

resource "aws_route53_record" "alias" {
  count = var.enabled ? 1 : 0

  zone_id = var.dns_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.cdn.cloudfront_distribution_domain_name
    zone_id                = module.cdn.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

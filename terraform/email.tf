locals {
  tracking_redirect_domain = "mail-redirect.${data.aws_region.current.name}.${var.website_domain_name}"
}

resource "aws_sesv2_configuration_set" "default" {
  configuration_set_name = "${var.namespace}-default"

  delivery_options {
    tls_policy = "REQUIRE"
  }

  tracking_options {
    custom_redirect_domain = local.tracking_redirect_domain
  }
}

data "aws_sns_topic" "datadog_forwarder" {
  count = var.email_enable_tracking && var.ses_datadog_events_enabled ? 1 : 0
  name  = "datadog-forwarder"
}

resource "aws_sesv2_configuration_set_event_destination" "default" {
  count                  = var.email_enable_tracking && var.ses_datadog_events_enabled ? 1 : 0
  event_destination_name = "DatadogForwarderSNSTopic"
  configuration_set_name = aws_sesv2_configuration_set.default.configuration_set_name

  event_destination {
    sns_destination {
      topic_arn = join("", data.aws_sns_topic.datadog_forwarder[*].arn)
    }
    enabled = true
    matching_event_types = sort([
      "SEND",
      "REJECT",
      "BOUNCE",
      "COMPLAINT",
      "DELIVERY",
      "OPEN",
      "CLICK",
      "RENDERING_FAILURE",
      "DELIVERY_DELAY",
      "SUBSCRIPTION",
    ])
  }
}

# Need a certificate to support https links in emails
module "mail_redirect_ssl_certificate" {
  source  = "cloudposse/acm-request-certificate/aws"
  version = "0.18.0"

  # CloudFront SSL certificates must be managed in us-east-1
  providers = {
    aws = aws.us-east-1
  }

  domain_name                       = local.tracking_redirect_domain
  zone_id                           = data.aws_ssm_parameter.public_dns_zone_id.value
  process_domain_validation_options = true
  wait_for_certificate_issued       = true
}

resource "aws_route53_record" "mail_redirect" {
  zone_id = data.aws_ssm_parameter.public_dns_zone_id.value
  name    = local.tracking_redirect_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.email_tracking.domain_name
    zone_id                = aws_cloudfront_distribution.email_tracking.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudfront_distribution" "email_tracking" {
  depends_on = [
    module.mail_redirect_ssl_certificate,
  ]

  comment = "GOST mail redirect CDN."
  enabled = true
  aliases = [local.tracking_redirect_domain]

  // Optimized for North America
  // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PriceClass.html
  price_class = "PriceClass_100"

  origin {
    domain_name = "r.${data.aws_region.current.name}.awstrack.me"
    origin_id   = "awstrack"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "match-viewer"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "awstrack"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "allow-all"

    forwarded_values {
      headers      = ["Host"]
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  viewer_certificate {
    acm_certificate_arn      = module.mail_redirect_ssl_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

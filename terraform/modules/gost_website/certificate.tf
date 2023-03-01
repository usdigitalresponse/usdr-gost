provider "aws" {
  region = "us-east-1"
  alias  = "cloudfront_certificate"
}

module "cloudfront_ssl_certificate" {
  source  = "cloudposse/acm-request-certificate/aws"
  version = "0.17.0"
  context = module.this.context

  # CloudFront SSL certificates must be managed in us-east-1
  providers = {
    aws = aws.cloudfront_certificate
  }

  domain_name                       = var.domain_name
  zone_id                           = var.dns_zone_id
  process_domain_validation_options = true
  wait_for_certificate_issued       = true
}

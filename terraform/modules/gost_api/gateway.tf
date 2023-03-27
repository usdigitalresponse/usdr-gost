module "http_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.0.1"
  context = module.this.context

  vpc_id           = var.vpc_id
  attributes       = ["api"]
  allow_all_egress = true

  rules = [
    {
      key       = "HTTP"
      type      = "ingress"
      from_port = local.api_container_port
      to_port   = local.api_container_port
      protocol  = "tcp"
      self      = true
    }
  ]

  create_before_destroy = true
}

module "ssl_certificate" {
  enabled = var.enabled
  source  = "cloudposse/acm-request-certificate/aws"
  version = "0.17.0"

  domain_name                       = var.domain_name
  zone_id                           = var.dns_zone_id
  process_domain_validation_options = true
  wait_for_certificate_issued       = true
}

module "api_gateway" {
  create  = var.enabled
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "2.2.2"

  name          = var.namespace
  description   = "API Gateway proxy to ECS web services for GOST"
  protocol_type = "HTTP"

  domain_name                 = var.domain_name
  domain_name_certificate_arn = module.ssl_certificate.arn

  cors_configuration = {
    allow_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    allow_origins = sort(distinct(concat(
      [for origin in [var.domain_name, var.website_domain_name] : "https://${origin}"],
      var.cors_allowed_origins,
    )))
    allow_credentials = true
    allow_headers = [
      "authorization",
      "content-type",
      "x-amz-date",
      "x-amz-security-token",
      "x-amz-user-agent",
      "x-api-key",
    ]
    max_age = 86400 // 24 hours, in seconds
  }

  default_stage_access_log_destination_arn = join("", aws_cloudwatch_log_group.default.*.arn)
  default_stage_access_log_format = jsonencode({
    requestId      = "$context.requestId"
    ip             = "$context.identity.sourceIp"
    requestTime    = "$context.requestTime"
    httpMethod     = "$context.httpMethod"
    routeKey       = "$context.routeKey"
    status         = "$context.status"
    protocol       = "$context.protocol"
    responseLength = "$context.responseLength"
    path           = "$context.path"
    integration = {
      error         = "$context.integration.error"
      serviceStatus = "$context.integration.integrationStatus"
      latency       = "$context.integration.latency"
      requestId     = "$context.integration.requestId"
      status        = "$context.integration.status"
      errorMessage  = "$context.integrationErrorMessage"
      latency       = "$context.integrationLatency"
    }
  })

  integrations = {
    "$default" = {
      connection_type    = "VPC_LINK"
      vpc_link           = "api-service"
      integration_uri    = join("", aws_service_discovery_service.default.*.arn)
      integration_type   = "HTTP_PROXY"
      integration_method = "ANY"
    }
  }

  vpc_links = {
    api-service = {
      name               = "${var.namespace}-api"
      security_group_ids = [module.http_security_group.id]
      subnet_ids         = var.subnet_ids
    }
  }
}

resource "aws_route53_record" "alias" {
  count = var.enabled ? 1 : 0

  zone_id = var.dns_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.api_gateway.apigatewayv2_domain_name_target_domain_name
    zone_id                = module.api_gateway.apigatewayv2_domain_name_hosted_zone_id
    evaluate_target_health = false
  }
}

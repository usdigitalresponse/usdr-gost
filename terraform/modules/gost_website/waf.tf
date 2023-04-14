locals {
  expanded_rules = flatten([
    for k, v in var.managed_waf_rules : {
      name     = k,
      priority = v.priority,
      statement = {
        name        = v.managed_rule
        vendor_name = "AWS"
      },
      visibility_config = {
        cloudwatch_metrics_enabled = v.metric_visibility,
        sampled_requests_enabled   = v.metric_visibility,
        metric_name                = "${k}-metric"
      }
    }
  ])
}

module "waf" {
  source         = "cloudposse/waf/aws"
  version        = "0.2.0"
  scope          = "CLOUDFRONT"
  default_action = "allow"

  managed_rule_group_statement_rules = local.expanded_rules

  # WAFv2 must be managed in us-east-1 if globally scoped
  providers = {
    aws = aws.us-east-1
  }

  context = module.this.context
}
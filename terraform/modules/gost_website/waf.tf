locals {
  expanded_rules = flatten([
    for r in var.managed_waf_rules : {
      name     = r.key,
      priority = r.priority,
      statement = {
        name        = r.managed_rule
        vendor_name = "AWS"
      },
      visibility_config = {
        cloudwatch_metrics_enabled = r.metric_visibility,
        sampled_requests_enabled   = r.metric_visibility,
        metric_name                = "${r.key}-metric"
      }
    }
  ])
}

module "waf" {
  source  = "cloudposse/waf/aws"
  version = "0.2.0"

  managed_rule_group_statement_rules = local.expanded_rules

  context = module.this.context
}
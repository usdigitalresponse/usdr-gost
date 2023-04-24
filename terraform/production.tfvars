namespace = "gost-prod"

// Common
ssm_service_parameters_path_prefix    = "/gost/prod"
ssm_deployment_parameters_path_prefix = "/gost/prod/deploy-config"

// Website
website_enabled     = true
website_domain_name = "grants.usdigitalresponse.org"
website_managed_waf_rules = {
  "AnonymousIpList" = {
    managed_rule      = "AWSManagedRulesAnonymousIpList",
    priority          = 5,
    metric_visibility = false
  },
  "AmazonIpReputationList" = {
    managed_rule      = "AWSManagedRulesAmazonIpReputationList",
    priority          = 10,
    metric_visibility = false
  },
  "CommonRuleSet" = {
    managed_rule      = "AWSManagedRulesCommonRuleSet",
    priority          = 20,
    metric_visibility = true
  },
  "KnownBadInputsRuleSet" = {
    managed_rule      = "AWSManagedRulesKnownBadInputsRuleSet",
    priority          = 30,
    metric_visibility = true
  }
}

// ECS Cluster
cluster_container_insights_enabled = true

// API / Backend
api_enabled                    = true
api_container_image_tag        = "stable"
api_default_desired_task_count = 3
api_minumum_task_count         = 2
api_maximum_task_count         = 5
api_enable_grants_scraper      = true
api_log_retention_in_days      = 30

// Postgres
postgres_enabled                   = true
postgres_prevent_destroy           = true
postgres_snapshot_before_destroy   = true
postgres_apply_changes_immediately = false

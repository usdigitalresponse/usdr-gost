namespace = "gost-staging"
env       = "staging"

// Common
ssm_service_parameters_path_prefix    = "/gost/staging"
ssm_deployment_parameters_path_prefix = "/gost/staging/deploy-config"

// Datadog provider
datadog_draft                        = true
datadog_monitors_enabled             = true
datadog_monitor_notification_handles = []

// Website
website_enabled     = true
website_domain_name = "staging.grants.usdr.dev"
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
website_datadog_rum_enabled = true
website_datadog_rum_options = {
  sessionSampleRate       = 10
  sessionReplaySampleRate = 1
  trackUserInteractions   = true
  trackResources          = true
  trackLongTasks          = true
}
website_feature_flags = {
  myProfileEnabled                            = true,
  newTerminologyEnabled                       = true,
  newGrantsDetailPageEnabled                  = false,
  categoryOfFundingActivitySearchFieldEnabled = true,
}

// ECS Cluster
cluster_container_insights_enabled = true

// API / Backend
api_enabled                           = true
api_default_desired_task_count        = 1
api_minumum_task_count                = 1
api_maximum_task_count                = 5
api_enable_grants_scraper             = false
api_enable_grants_digest              = false
api_enable_new_team_terminology       = true
api_enable_my_profile                 = true
api_enable_saved_search_grants_digest = true
api_log_retention_in_days             = 14
api_datadog_environment_variables = {
  DD_PROFILING_ENABLED = true,
}

// Postgres
postgres_enabled                   = true
postgres_prevent_destroy           = true
postgres_snapshot_before_destroy   = true
postgres_apply_changes_immediately = false
postgres_query_logging_enabled     = true

// Grant events consumer
consume_grants_source_event_bus_name = "default"
consume_grants_datadog_environment_variables = {
  DD_PROFILING_ENABLED = true,
}

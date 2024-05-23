namespace = "gost-staging"
env       = "staging"

// Common
ssm_service_parameters_path_prefix    = "/gost/staging"
ssm_deployment_parameters_path_prefix = "/gost/staging/deploy-config"

// Datadog provider
datadog_draft                        = true
datadog_monitors_enabled             = true
datadog_monitor_notification_handles = []
ses_datadog_events_enabled           = true

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
  sessionSampleRate       = 100
  sessionReplaySampleRate = 100
  trackUserInteractions   = true
  trackResources          = true
  trackLongTasks          = true
}
website_feature_flags = {
  newTerminologyEnabled      = true,
  newGrantsDetailPageEnabled = true,
}

// Google Analytics Account ID: 233192355, Property ID: 429910307, Stream ID: 7590745080
website_google_tag_id = "G-D5DFR7BN0N"

// ECS Cluster
cluster_container_insights_enabled = true

// API / Backend
api_enabled                            = true
api_default_desired_task_count         = 1
api_minumum_task_count                 = 1
api_maximum_task_count                 = 5
api_enable_grants_scraper              = false
api_enable_new_team_terminology        = true
api_enable_saved_search_grants_digest  = true
api_enable_grant_digest_scheduled_task = true
api_log_retention_in_days              = 14
api_datadog_environment_variables = {
  DD_PROFILING_ENABLED = true,
}
api_container_environment = {
  NEW_GRANT_DETAILS_PAGE_ENABLED = true,
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

// Email
email_enable_tracking = true

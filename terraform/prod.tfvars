namespace = "gost-prod"
env       = "production"

// Common
ssm_service_parameters_path_prefix    = "/gost/prod"
ssm_deployment_parameters_path_prefix = "/gost/prod/deploy-config"

// Datadog provider
datadog_draft            = false
datadog_monitors_enabled = true
datadog_monitor_notification_handles = [
  "thendrickson@usdigitalresponse.org",
  "asridhar@usdigitalresponse.org",
]
ses_datadog_events_enabled = true
default_datadog_environment_variables = {
  DD_LOGS_INJECTION          = true
  DD_PROFILING_ENABLED       = true
  DD_RUNTIME_METRICS_ENABLED = true
}

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
website_datadog_rum_enabled = true
website_datadog_rum_options = {
  sessionSampleRate       = 100
  sessionReplaySampleRate = 80
  trackUserInteractions   = true
  trackResources          = true
  trackLongTasks          = true
}
website_feature_flags = {
  newTerminologyEnabled          = true,
  newGrantsDetailPageEnabled     = true,
  shareTerminologyEnabled        = true,
  followNotesEnabled             = false,
  enableFullFileExport           = true,
  arpaTransitionMessageEnabled   = true,
  grantsTransitionMessageEnabled = true,
  arpaLoginEnabled               = false,
  grantsLoginEnabled             = false,
}

// Google Analytics Account ID: 233192355, Property ID: 321194851, Stream ID: 3802896350
website_google_tag_id = "G-WCDTMFM6RG"

// ECS Cluster
cluster_container_insights_enabled = true

// API / Backend
api_enabled                            = true
api_default_desired_task_count         = 3
api_minumum_task_count                 = 2
api_maximum_task_count                 = 5
api_enable_new_team_terminology        = true
api_enable_saved_search_grants_digest  = true
api_enable_grant_digest_scheduled_task = true
api_log_retention_in_days              = 30
api_container_environment = {
  NEW_GRANT_DETAILS_PAGE_ENABLED = true
  SHARE_TERMINOLOGY_ENABLED      = true
}
enabled_email_types = [
  "welcome",
  "passcode",
]
disable_all_emails = true

// Postgres
postgres_enabled                   = true
postgres_prevent_destroy           = true
postgres_snapshot_before_destroy   = true
postgres_apply_changes_immediately = false
postgres_ca_cert_identifier        = "rds-ca-rsa2048-g1"

// Grant events consumer
consume_grants_source_event_bus_name = "default"

// Email
email_enable_tracking = true


// Data migration
data_migration_destination_bucket_names = [
  "588738567097-data-migration",
]

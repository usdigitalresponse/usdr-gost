variable "namespace" {
  type = string
}

variable "env" {
  description = "Value to set as the default env tag on all resources that support tagging."
  type        = string
}

variable "version_identifier" {
  description = "Version identifier (e.g. commit SHA) for this deployment."
  type        = string
  default     = "dev"
}

// Variables used by Terraform to provision resources with the Datadog provider
// NOTE: Variables unrelated to the Datadog Terraform provider, like API keys and tags
//  used at runtime, are configured outside of this section.
variable "datadog_api_key" {
  description = "API key to use when provisioning Datadog resources."
  type        = string
  default     = ""
  sensitive   = true
}

variable "datadog_app_key" {
  description = "Application key to use when provisioning Datadog resources."
  type        = string
  default     = ""
  sensitive   = true
}

variable "datadog_monitors_enabled" {
  description = "Whether to provision Datadog monitors."
  type        = bool
  default     = false
}

variable "datadog_monitor_notification_handles" {
  description = "List of handles to notify on monitor alerts."
  type        = list(string)
  default     = []
}

variable "datadog_draft" {
  description = "Marks Datadog resources as drafts. Set to false when deploying to Production."
  type        = bool
  default     = true
}

// Common
variable "permissions_boundary_policy_name" {
  description = "Name of the permissions boundary for service roles"
  type        = string
  default     = "service-management-boundary"
}

variable "ssm_service_parameters_path_prefix" {
  type        = string
  description = "Base path for all service-managed SSM parameters."
  validation {
    condition     = startswith(var.ssm_service_parameters_path_prefix, "/")
    error_message = "Value must start with a forward slash."
  }
  validation {
    condition     = !endswith(var.ssm_service_parameters_path_prefix, "/")
    error_message = "Value cannot end with a trailing slash."
  }
}

variable "ssm_deployment_parameters_path_prefix" {
  type        = string
  description = "Base path for all SSM parameters used for deployment."
  validation {
    condition     = startswith(var.ssm_deployment_parameters_path_prefix, "/")
    error_message = "Value must start with a forward slash."
  }
  validation {
    condition     = !endswith(var.ssm_deployment_parameters_path_prefix, "/")
    error_message = "Value cannot end with a trailing slash."
  }
}

// Website
variable "website_enabled" {
  type    = bool
  default = true
}

variable "website_domain_name" {
  type = string
}

variable "website_managed_waf_rules" {
  description = "Map of rules and associated parameters for managed WAF ACL"
  type = map(object({
    managed_rule      = string
    priority          = number
    metric_visibility = bool
  }))
  default = {}
}

variable "website_origin_artifacts_dist_path" {
  description = "Path to the local directory from which website build artifacts are sourced and uploaded to the S3 origin bucket."
  type        = string
  default     = ""
}

variable "website_datadog_rum_enabled" {
  description = "Whether to enable Datadog RUM on the website."
  type        = bool
  default     = false
}

variable "website_datadog_rum_options" {
  description = "Configuration options for Datadog RUM data collection (if var.website_datadog_rum_enabled is true)."
  type = object({
    sessionSampleRate       = number
    sessionReplaySampleRate = number
    trackUserInteractions   = bool
    trackResources          = bool
    trackLongTasks          = bool
  })
  default = {
    sessionSampleRate       = 100
    sessionReplaySampleRate = 20
    trackUserInteractions   = true
    trackResources          = true
    trackLongTasks          = true
  }
}

variable "website_feature_flags" {
  description = "Map of website feature flag names and their values."
  type        = any
  default     = {}
  validation {
    condition     = can(lookup(var.website_feature_flags, uuid(), "default"))
    error_message = "Value must be an object."
  }
}

variable "website_google_tag_id" {
  description = "Enables Google Analytics for the website if set"
  type        = string
  default     = ""
}

// ECS cluster
variable "cluster_container_insights_enabled" {
  type    = bool
  default = true
}

// API / Backend
variable "api_enabled" {
  type    = bool
  default = true
}

variable "api_domain_name" {
  type    = string
  default = ""
}

variable "api_container_image_tag" {
  type = string
}

variable "api_container_environment" {
  type    = map(string)
  default = {}
}

variable "api_datadog_environment_variables" {
  type    = map(string)
  default = {}
}

variable "api_default_desired_task_count" {
  type = number
}

variable "api_enable_grants_scraper" {
  type = bool
}

variable "api_enable_grants_digest" {
  type = bool
}

variable "api_enable_new_team_terminology" {
  type = bool
}

variable "api_enable_my_profile" {
  type = bool
}

variable "api_enable_saved_search_grants_digest" {
  type = bool
}

variable "api_log_retention_in_days" {
  type = number
}

variable "api_minumum_task_count" {
  type = number
}

variable "api_maximum_task_count" {
  type = number
}

// Postgres
variable "postgres_enabled" {
  type    = bool
  default = true
}
variable "postgres_prevent_destroy" {
  type    = bool
  default = true
}
variable "postgres_snapshot_before_destroy" {
  type    = bool
  default = true
}
variable "postgres_apply_changes_immediately" {
  type    = bool
  default = false
}
variable "postgres_query_logging_enabled" {
  type    = bool
  default = false
}

# Consume Grants
variable "consume_grants_source_event_bus_name" {
  type = string
}

variable "consume_grants_datadog_environment_variables" {
  type    = map(string)
  default = {}
}

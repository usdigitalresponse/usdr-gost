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

variable "website_feature_flags" {
  description = "Map of website feature flag names and their values."
  type        = any
  default     = {}
  validation {
    condition     = can(lookup(var.myobj, uuid(), "default"))
    error_message = "Value must be an object."
  }
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

variable "api_default_desired_task_count" {
  type = number
}

variable "api_enable_grants_scraper" {
  type = bool
}

variable "api_enable_grants_digest" {
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
  default = true
}
variable "postgres_prevent_destroy" {
  default = true
}
variable "postgres_snapshot_before_destroy" {
  default = true
}
variable "postgres_apply_changes_immediately" {
  default = false
}
variable "postgres_query_logging_enabled" {
  default = false
}

# Consume Grants
variable "consume_grants_source_event_bus_name" {
  type = string
}

variable "namespace" {
  type = string
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
  description = "List of parameters for managed WAF rules"
  type = list(object({
    name              = string
    priority          = number
    metric_visibility = bool
  }))
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

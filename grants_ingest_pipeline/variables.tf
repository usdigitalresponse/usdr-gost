variable "enabled" {
  type        = bool
  description = "When false, disables resource creation."
  default     = true
}

variable "namespace" {
  type        = string
  description = "Prefix to use for resource names and identifiers."
}

variable "permissions_boundary_policy_name" {
  description = "Name of the permissions boundary for service roles"
  type        = string
  default     = "service-management-boundary"
}

variable "tags" {
  type    = map(string)
  default = {}
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

variable "datadog_enabled" {
  description = "Whether to enable datadog instrumentation in the current environment."
  type        = bool
  default     = false
}

variable "additional_lambda_environment_variables" {
  description = "Map of additional/override environment variables to apply to all Lambda functions."
  type = map(string)
  default = {}
}

variable "datadog_tags" {
  description = "Datadog reserved tags to configure in Lambda function environments (when var.datadog_enabled is true)."
  type = object({
    DD_ENV     = string
    DD_SERVICE = string
    DD_VERSION = optional(string)
  })
  default = {
    DD_ENV     = ""
    DD_SERVICE = "grants-ingest-pipeline"
    DD_VERSION = ""
  }
}

variable "lambda_default_log_retention_in_days" {
  description = "Default number of days to retain Lambda execution logs."
  type        = number
  default     = 30
}

variable "lambda_default_log_level" {
  description = "Default logging level to configure (as LOG_LEVEL env var) on Lambda functions."
  type        = string
  default     = "INFO"
}

variable "eventbridge_scheduler_enabled" {
  description = "If false, uses CloudWatch Events to schedule Lambda execution. This should only be false in local development."
  type        = bool
  default     = true
}

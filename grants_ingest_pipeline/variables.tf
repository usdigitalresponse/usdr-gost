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

variable "datadog_enabled" {
  description = "Whether to enable datadog instrumentation in the current environment."
  type        = bool
  default     = false
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

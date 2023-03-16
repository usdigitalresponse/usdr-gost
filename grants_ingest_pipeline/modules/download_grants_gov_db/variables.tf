// Common
variable "namespace" {
  type        = string
  description = "Prefix to use for resource names and identifiers."
}

variable "permissions_boundary_arn" {
  description = "ARN of the IAM policy to apply as a permissions boundary when provisioning a new role. Ignored if `role_arn` is null."
  type        = string
  default     = null
}

variable "lambda_layer_arns" {
  description = "Lambda layer ARNs to attach to the function."
  type        = list(string)
  default     = []
}

variable "lambda_artifact_bucket" {
  description = "Name of the S3 bucket used to store Lambda source artifacts."
  type        = string
}

variable "lambda_code_path" {
  description = "Path to the local directory containing lambda code."
  type        = string
}

variable "log_level" {
  description = "Value for the LOG_LEVEL environment variable."
  type        = string
  default     = "INFO"
}

variable "log_retention_in_days" {
  description = "Number of days to retain logs."
  type        = number
  default     = 30
}

variable "additional_lambda_execution_policy_documents" {
  description = "JSON policy document(s) containing permissions to configure for the Lambda function, in addition to any defined by this module."
  type        = list(string)
  default     = []
}

variable "additional_environment_variables" {
  description = "Environment variables to configure for the Lambda function, in addition to any defined by this module."
  type        = map(string)
  default     = {}
}

// Module-specific
variable "eventbridge_scheduler_enabled" {
  description = "If false, uses CloudWatch Events to schedule Lambda execution. This should only be false in development."
  type        = bool
  default     = true
}

variable "scheduler_group_name" {
  description = "Name of the AWS EventBridge Scheduler group in which scheuldes should be placed."
  type        = string
}

variable "grants_source_data_bucket_name" {
  description = "Name of the S3 bucket used to store grants source data."
  type        = string
}

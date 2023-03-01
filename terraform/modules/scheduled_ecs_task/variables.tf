variable "enabled" {
  description = "When false, disables resource creation."
  type        = bool
  default     = true
}

variable "name_prefix" {
  description = "Value to use as a prefix when naming created resources."
  type        = string
}

variable "cluster_arn" {
  description = "ARN of the ECS cluster in which the task will run."
  type        = string
}

variable "task_definition_arn" {
  description = "ARN of the ECS task definition to run according to the schedule."
  type        = string
}

variable "task_revision" {
  description = "The task definition revision for the scheduler to run. If LATEST, the scheduler will run the latest active revision of the task definition. If null, the revision specified in task_definition_arn will be used."
  type        = string

  validation {
    condition     = can(regex("^\\d+$", var.task_revision)) || var.task_revision == "LATEST"
    error_message = "The task_revision value must be a numeric revision identifier or \"LATEST\"."
  }
}

variable "task_override" {
  description = "JSON string which will be converted to TaskOverride input. See TaskOverride in the ECS API documentation for more information."
  type        = string
  default     = null
}

variable "role_arn" {
  description = "ARN of the IAM role that EventBridge Scheduler will use for this target when the schedule is invoked. If not provided, a new role will be provisioned automatically."
  type        = string
  default     = null
}

variable "task_execution_role_arn" {
  description = "ARN of the IAM role that will be used as the execution role for tasks run by the scheduler."
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the IAM role that will be used as the task role for tasks run by the scheduler."
  type        = string
}

variable "permissions_boundary_arn" {
  description = "ARN of the IAM policy to apply as a permissions boundary when provisioning a new role. Ignored if `role_arn` is null."
  type        = string
  default     = null
}

variable "scheduler_group_name" {
  description = "Name of the scheduler group to associate with this schedule."
  type        = string
  default     = null
}

variable "description" {
  description = "Brief description of the schedule."
  type        = string
  default     = null
}

variable "schedule_expression" {
  description = "EventBridge rate or cron schedule expression that defines when the schedule runs."
  type        = string
}

variable "schedule_expression_timezone" {
  description = "IANA identifier for the timezone in which the scheduling expression is evaluated. Defaults to UTC."
  type        = string
  default     = "UTC"
}

variable "schedule_enabled" {
  description = "If false, disables the schedule."
  type        = bool
  default     = true
}

variable "start_date" {
  description = "The date, in UTC, after which the schedule can begin invoking its target."
  type        = string
  default     = null
}

variable "end_date" {
  description = "The date, in UTC, before which the schedule can invoke its target."
  type        = string
  default     = null
}

variable "flexible_time_window" {
  description = "Maximum time window during which a schedule can be invoked, up to 24 hours. If null, the schedule will be fixed."
  type = object({
    hours   = optional(number)
    minutes = optional(number)
  })
  default = null

  validation {
    condition = sum([
      coalesce(lookup(coalesce(var.flexible_time_window, {}), "hours", 0), 0) * 60,
      coalesce(lookup(coalesce(var.flexible_time_window, {}), "minutes", 0), 0),
    ]) <= 1440
    error_message = "Total flexible_time_window value cannot exceed 24 hours (1,440 minutes)."
  }
}

variable "enable_ecs_managed_tags" {
  description = "Specifies whether to enable Amazon ECS managed tags for the task."
  type        = bool
  default     = false
}

variable "enable_execute_command" {
  description = "Specifies whether to enable the execute command functionality for the containers in this task."
  type        = bool
  default     = false
}

variable "group" {
  description = "Specifies an ECS task group for the task."
  type        = string
  default     = null
}

variable "launch_type" {
  description = "Specifies the launch type on which your task is running. The launch type that you specify here must match one of the launch type (compatibilities) of the target task."
  type        = string
}

variable "platform_version" {
  description = "Specifies the platform version for the task. Specify only the numeric portion of the platform version, such as `1.1.0`."
  type        = string
  default     = null
}

variable "should_propagate_tags" {
  description = "Specifies whether to propagate the tags from the task definition to the task."
  type        = bool
  default     = false
}

variable "reference_id" {
  description = "Reference ID to use for the task."
  type        = string
  default     = null
}

variable "task_count" {
  description = "The number of tasks to create. Ranges from `1` (default) to `10`."
  type        = number
  default     = 1

  validation {
    condition     = var.task_count >= 1
    error_message = "The task_count value cannot be less than 1."
  }

  validation {
    condition     = var.task_count <= 10
    error_message = "The task_count value cannot exceed 10."
  }
}

variable "task_tags" {
  description = "The metadata that you apply to the task. Each tag consists of a key and an optional value. For more information, see RunTask in the Amazon ECS API Reference."
  type        = map(string)
  default     = {}
}

variable "sqs_dlq_arn" {
  description = "ARN for the SQS queue to use as a dead-letter queue for failed scheduled events."
  type        = string
  default     = null
}

variable "capacity_provider_strategies" {
  description = "Up to 6 capacity provider strategies to use for the task."
  type = list(object({
    base              = optional(number)
    capacity_provider = string
    weight            = optional(number)
  }))
  default = []

  validation {
    condition     = length(var.capacity_provider_strategies) <= 6
    error_message = "Only up to 6 capacity provider strategies are supported."
  }
}

variable "network_configuration" {
  description = "Configures the networking associated with the task."
  type = object({
    assign_public_ip = bool
    security_groups  = set(string)
    subnets          = set(string)
  })
  default = null
}

variable "placement_constraints" {
  description = "Placement constraints to use for the task. The `expression` value must be null when `type` is 'distinctInstance'."
  type = list(object({
    expression = optional(string)
    type       = string
  }))
  default = []
}

variable "placement_strategies" {
  description = "Configures placement strategy for the task."
  type = list(object({
    field = string
    type  = string
  }))
  default = []
}

variable "retry_policy_max_event_age" {
  description = "Maximum amount of time to continue to make retry attempts."
  type = object({
    hours   = optional(number)
    minutes = optional(number)
    seconds = optional(number)
  })
  default = null

  validation {
    condition = (var.retry_policy_max_event_age == null || coalesce([
      for total_seconds in [sum([
        coalesce(lookup(coalesce(var.retry_policy_max_event_age, {}), "hours", 0), 0) * 60 * 60,
        coalesce(lookup(coalesce(var.retry_policy_max_event_age, {}), "minutes", 0), 0) * 60,
        coalesce(lookup(coalesce(var.retry_policy_max_event_age, {}), "seconds", 0), 0),
      ])] : (total_seconds <= 86400 && total_seconds >= 60)
    ]...))
    error_message = "Total retry_policy_max_event_age value cannot exceed 24 hours (1,440 minutes / 86,400 seconds)."
  }
}

variable "retry_policy_max_attempts" {
  description = "Maximum number of retry attempts to make before the request fails."
  type        = number
  default     = null
}

variable "kms_key_arn" {
  description = "ARN for the customer-managed KMS key that EventBridge Scheduler will use to encrypt/decrypt your data."
  type        = string
  default     = null
}

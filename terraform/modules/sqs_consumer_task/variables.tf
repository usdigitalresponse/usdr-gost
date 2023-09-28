variable "namespace" {
  description = "Prefix to use for resource names and identifiers."
  type        = string
}

variable "name" {
  description = "Name prefix for resource names and identifiers"
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "permissions_boundary_arn" {
  description = "ARN of the IAM policy to apply as a permissions boundary when provisioning a new role. Ignored if `role_arn` is null."
  type        = string
  default     = null
}

variable "consumer_container_environment" {
  description = "Map of environment variables for the consumer container."
  type        = map(string)
  default     = {}
}

variable "queue_url_environment_variable_name" {
  description = "The name of the environment variable that provides the SQS queue URL in the consumer container."
  type        = string
  default     = "TASK_QUEUE_URL"
  validation {
    condition     = upper(var.queue_url_environment_variable_name) == var.queue_url_environment_variable_name
    error_message = "Environment variable names must be uppercase."
  }
}

variable "consumer_task_command" {
  description = "The command to execute when starting an ECS task's consumer container."
  type        = list(string)
}

variable "consumer_task_efs_volume_mounts" {
  description = "EFS volumes to mount in ECS task consumer containers."
  type = list(object({
    name            = string
    container_path  = string
    read_only       = bool
    file_system_id  = string
    access_point_id = string
  }))
}

variable "stop_timeout_seconds" {
  description = "Number of seconds to wait before the container is killed after initiating shutdown."
  type        = number
  validation {
    condition     = var.stop_timeout_seconds <= 120
    error_message = "Stop timeout for ECS containers cannot exceed 120 seconds."
  }
  validation {
    condition     = var.stop_timeout_seconds >= 0
    error_message = "Stop timeout cannot be a negative duration."
  }
}

variable "consumer_task_size" {
  description = "Total available CPU and memory allocated for each ECS task (for all containers). See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size"
  type = object({
    cpu    = number
    memory = number
  })
  default = {
    cpu    = 256
    memory = 512
  }
}

variable "additional_task_role_json_policies" {
  description = "Mapping of JSON-encoded IAM policy documents, keyed by policy name, to add as inline policies on the ECS task role."
  type        = map(string)
  default     = {}
}

variable "log_retention" {
  type        = number
  description = "Number of days to retain API logs in CloudWatch."
  default     = 30
}

variable "ssm_path_prefix" {
  type        = string
  description = "Base path for all managed SSM parameters used by the service."
  validation {
    condition     = startswith(var.ssm_path_prefix, "/")
    error_message = "Value must start with a forward slash."
  }
  validation {
    condition     = !endswith(var.ssm_path_prefix, "/")
    error_message = "Value cannot end with a trailing slash."
  }
}

variable "rds_db_connect_resources" {
  description = "Resource ARNs for which rds-db:connect access should be allowed."
  type        = list(string)
}

variable "postgres_username" {
  description = "Username for authenticated connecting to the Postgres db."
  type        = string
}

variable "postgres_endpoint" {
  description = "Endpoint for connecting to the Postgres db."
  type        = string
}

variable "postgres_port" {
  description = "Port for connecting to the Postgres db."
  type        = number
  default     = 5432
}

variable "postgres_db_name" {
  description = "Name of the Postgres db to which the API will connect."
  type        = string
}

variable "subnet_ids" {
  description = "Subnect IDs for the ECS service."
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs for the API ECS service."
  type        = list(string)
  default     = []
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster in which to create the API service."
  type        = string
}

variable "docker_repository" {
  description = "Docker repository that provides API container images."
  type        = string
  default     = "ghcr.io/usdigitalresponse/usdr-gost-api"
}

variable "docker_tag" {
  description = "Docker image tag to pull for the API container."
  type        = string
}

variable "datadog_agent_image_tag" {
  description = "Docker image tag to pull for the Datadog container."
  type        = string
  default     = "latest"
}

variable "datadog_environment_variables" {
  description = "Datadog-related environment variables to apply to both consumer and Datadog container runtime environments. See also: var.unified_service_tags."
  type        = map(string)
  default     = {}
}

variable "unified_service_tags" {
  description = "Datadog unified service tags to apply to runtime environments."
  type = object({
    env     = string
    service = string
    version = optional(string)
  })
}

variable "sqs_visibility_timeout_seconds" {
  description = "The visibility timeout for the queue."
  type        = number
  default     = null
}

variable "sqs_delay_seconds" {
  description = "The time that the delivery of all messages in the queue will be delayed."
  type        = number
  default     = null
}

variable "sqs_receive_wait_time_seconds" {
  description = "The time for which a ReceiveMessage call will wait for a message to arrive (long polling) before returning."
  type        = number
  default     = 20
}

variable "sqs_max_receive_count" {
  description = "The number of times a message may be received before it is dropped or sent to the DLQ."
  type        = number
  default     = 5
}

variable "sqs_message_retention_seconds" {
  description = "The number of seconds SQS retains a message before it is dropped or sent to the DLQ."
  type        = number
  default     = 10080 # 7 days, in seconds
}

variable "sqs_max_message_size" {
  description = "The limit of how many bytes a message can contain before SQS rejects it."
  type        = number
  default     = 1024 # 1 KiB, in bytes
}

variable "sqs_publisher" {
  description = "Identifies the resource that should be allowed to publish messages to the queue. See the module README for more information."
  type = object({
    principal_type       = string
    principal_identifier = string
    source_arn           = optional(string)
  })
}

variable "sqs_dlq_enabled" {
  description = "Whether to create a dead-letter queue for the main SQS queue."
  type        = bool
  default     = true
}

variable "sqs_dlq_message_retention_seconds" {
  description = "The number of seconds SQS retains a message before it is dropped or sent to the DLQ."
  type        = number
  default     = 10080 # 7 days, in seconds
}

variable "autoscaling_message_thresholds" {
  description = "SQS message count thresholds for scaling up task workers. See the module README for more information."
  type        = list(number)
  validation {
    condition     = alltrue([for i in var.autoscaling_message_thresholds : (i > 0)])
    error_message = "All values must be greater than zero."
  }
}

variable "autoscaling_scale_up_cooldown_seconds" {
  description = "Duration to wait after a scale-up activity completes before the next scale-up activity can start."
  type        = number
  default     = 60
}

variable "autoscaling_scale_up_evaluation_period_seconds" {
  description = "The period over which the sum of available SQS messages is evaluated for scale-up activities."
  type        = number
  default     = 60
}

variable "autoscaling_scale_down_evaluation_period_seconds" {
  description = "The period over which the sum of available SQS messages is evaluated for scale-down activities."
  type        = number
  default     = 60
}

variable "scale_up_evaluation_periods" {
  description = "The number of periods over which the sum of available SQS messages is compared to the scale-up threshold."
  type        = number
  default     = 1
}

variable "scale_down_evaluation_periods" {
  description = "The number of periods over which the sum of available SQS messages is compared to the scale-down threshold."
  type        = number
  default     = 1
}

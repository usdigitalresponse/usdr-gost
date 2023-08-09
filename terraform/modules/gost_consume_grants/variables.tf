variable "namespace" {
  description = "Prefix to use for resource names and identifiers."
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
  description = "Map of environment variables for the api container."
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
  sensitive   = true
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

variable "unified_service_tags" {
  description = "Datadog unified service tags to apply to runtime environments."
  type = object({
    env     = string
    service = string
    version = optional(string)
  })
}

variable "datadog_environment_variables" {
  description = "Datadog-related environment variables to apply to both consumer and Datadog container runtime environments. See also: var.unified_service_tags."
  type        = map(string)
  default     = {}
}

variable "sqs_dlq_enabled" {
  description = "Whether to create a dead-letter queue for the main SQS queue."
  type        = bool
  default     = true
}

variable "grants_ingest_event_bus_name" {
  description = "Name of the EventBridge bus to which the grants-ingest service publishes grant modification events."
  type        = string
  default     = null
}

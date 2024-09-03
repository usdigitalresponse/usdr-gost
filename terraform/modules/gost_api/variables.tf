variable "enabled" {
  description = "When false, disables resource creation."
  type        = bool
  default     = true
}

variable "namespace" {
  description = "Prefix to use for resource names and identifiers."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "permissions_boundary_arn" {
  description = "ARN of the managed policy to set as the permissions boundary for all roles."
  type        = string
  default     = null
}

variable "api_container_environment" {
  description = "Map of environment variables for the api container."
  type        = map(string)
  default     = {}
}

variable "log_retention" {
  type        = number
  description = "Number of days to retain API logs in CloudWatch."
  default     = 30
}

variable "default_desired_task_count" {
  type        = number
  description = "Desired number of task instances for the API service. At least 2 are recommended for availability."
  default     = 2
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

variable "postgres_password" {
  description = "Password for authenticating to the Postgres db."
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

variable "vpc_id" {
  description = "VPC ID for the ECS service."
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

variable "ecs_cluster_id" {
  description = "ID of the ECS cluster in which to create the API service."
  type        = string
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

variable "domain_name" {
  description = "Fully-qualified domain name where the API should be hosted."
  type        = string
}

variable "dns_zone_id" {
  description = "Route53 Hosted Zone ID where DNS records for the API should be managed."
  type        = string
}

variable "website_domain_name" {
  description = "Fully-qualified domain name where the website is hosted."
  type        = string
}

variable "cors_allowed_origins" {
  description = "List of allowed origin domains for CORS configuration in addition to API and website domains."
  type        = list(string)
  default     = []
}

variable "notifications_email_address" {
  description = "SES domain from which email notifications should be sent."
  type        = string
  validation {
    condition     = length(split("@", var.notifications_email_address)) == 2
    error_message = "Email address must contain exactly one @ sign."
  }
}

variable "ses_configuration_set_default" {
  description = "Name of the configuration set that should be used for all emails sent through SES."
  type        = string
}

variable "ses_sandbox_mode_email_recipients" {
  description = "List of email addresses to verify so that they may receive emails when SES is in sandbox mode. ONLY USE THIS FOR DEVELOPMENT PURPOSES!"
  type        = list(string)
  default     = []
}

variable "enable_new_team_terminology" {
  description = "When true, sets the ENABLE_NEW_TEAM_TERMINOLOGY environment variable to true in the API container."
  type        = bool
  default     = false
}

variable "enable_saved_search_grants_digest" {
  description = "When true, sets the ENABLE_SAVED_SEARCH_GRANTS_DIGEST environment variable to true in the API container."
  type        = bool
  default     = false
}

variable "enable_grant_digest_scheduled_task" {
  description = "When true, sets the ENABLE_GRANT_DIGEST_SCHEDULED_TASK environment variable to true in the API container."
  type        = bool
  default     = false
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
  description = "Datadog-related environment variables to apply to both API and Datadog container runtime environments. See also: var.unified_service_tags."
  type        = map(string)
  default     = {}
}

variable "autoscaling_desired_count_minimum" {
  description = "Minimum desired auto-scaling group capacity"
  type        = number
}

variable "autoscaling_desired_count_maximum" {
  description = "Maximum desired auto-scaling group capacity"
  type        = number
}

variable "enabled" {
  description = "If false, disables resource creation."
  type        = bool
  default     = true
}

variable "namespace" {
  description = "Prefix to use for resource names and identifiers."
  type        = string
}

variable "permissions_boundary_arn" {
  description = "ARN of the managed policy to set as the permissions boundary for all roles."
  type        = string
  default     = null
}

variable "vpc_id" {
  description = "VPC ID for the database cluster."
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the database cluster."
  type        = list(string)
}

variable "ingress_security_groups" {
  description = "Map of Security Group IDs (keys are informational and ignored) which should be allowed to connect (ingress) to Postgres."
  type        = map(string)
}

variable "apply_changes_immediately" {
  description = "Whether to apply cluster changes ahead of the next maintenance window (which may cause downtime). Set to true only when changes are urgent."
  type        = bool
  default     = false
}

variable "snapshot_before_destroy" {
  description = "Whether to create a final database snapshot before destroying the cluster."
  type        = bool
  default     = true
}

variable "prevent_destroy" {
  description = "Whether to enable deletion protection for the DB. The cluster cannot be destroyed when this value is true."
  type        = bool
  default     = true
}

variable "rds_db_connect_identifiers_for_iam_auth" {
  description = "Postgres role/user name(s) for generating rds-db:connect policy resource ARNs."
  type        = list(string)
  default     = []
}

variable "default_db_name" {
  description = "Name of the default Postgres database to create within the cluster."
  type        = string
}

variable "query_logging_enabled" {
  description = "Enable query logging for Postgres cluster."
  type        = bool
  default     = false
}
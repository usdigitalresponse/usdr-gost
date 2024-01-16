variable "enabled" {
  type        = bool
  description = "When false, disables resource creation."
  default     = true
}

variable "namespace" {
  type        = string
  description = "Prefix to use for resource names and identifiers."
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

variable "dns_zone_id" {
  description = "Route53 Hosted Zone ID where DNS records for the website should be managed."
  type        = string
}

variable "domain_name" {
  description = "Fully-qualified domain name where the website should be hosted."
  type        = string
}

variable "gost_api_domain" {
  description = "FQDN for the GOST API instance that should be accessed by the deployed website."
  type        = string
}

variable "datadog_rum_enabled" {
  description = "Whether to enable Datadog RUM."
  type        = bool
  default     = false
}

variable "datadog_rum_config" {
  description = "Runtime configuration options for Datadog RUM."
  type = object({
    applicationId           = string
    clientToken             = string
    site                    = string
    service                 = string
    env                     = string
    version                 = string
    sessionSampleRate       = number
    sessionReplaySampleRate = number
    trackUserInteractions   = bool
    trackResources          = bool
    trackLongTasks          = bool
    defaultPrivacyLevel     = string
    allowedTracingUrls      = list(string)
  })
  default = null

  validation {
    condition     = can(jsonencode(var.datadog_rum_config))
    error_message = "Value must be JSON-serializable."
  }
}

variable "feature_flags" {
  description = "Feature flags for configuring the website runtime"
  type        = any
  default     = {}
  validation {
    condition     = can(lookup(var.feature_flags, uuid(), "default"))
    error_message = "Value must be an object."
  }
  validation {
    condition     = can(jsonencode(var.feature_flags))
    error_message = "Value must be JSON-serializable."
  }
}

variable "google_tag_id" {
  description = "Enables Google Analytics for the website if set"
  type        = string
  default     = ""
}

variable "logs_bucket_versioning" {
  description = "Enable versioning for the logs S3 bucket"
  type        = bool
  default     = true
}

variable "managed_waf_rules" {
  description = "Map of rules and associated parameters for managed WAF ACL"
  type = map(object({
    managed_rule      = string
    priority          = number
    metric_visibility = bool
  }))
}

variable "origin_bucket_dist_path" {
  description = "Path to the directory where website build files should be stored in the S3 origin bucket."
  default     = "/dist"
  validation {
    condition     = startswith(var.origin_bucket_dist_path, "/")
    error_message = "Value must start with a forward slash."
  }
  validation {
    condition     = !endswith(var.origin_bucket_dist_path, "/")
    error_message = "Value cannot end with a forward slash."
  }
}

variable "origin_artifacts_dist_path" {
  description = "Path to the local directory from which website build artifacts are sourced and uploaded to the S3 origin bucket."
  type        = string
}

variable "origin_bucket_config_path" {
  description = "Path to the directory where non-build configuration files should be stored in the S3 origin bucket."
  default     = "/config"
  validation {
    condition     = startswith(var.origin_bucket_config_path, "/")
    error_message = "Value must start with a forward slash."
  }
  validation {
    condition     = !endswith(var.origin_bucket_config_path, "/")
    error_message = "Value cannot end with a forward slash."
  }
}

variable "origin_config_filename" {
  description = "Filename (relative to origin_bucket_config_path) from which the website loads non-build, deployment configuration directives."
  default     = "deploy-config.js"
  validation {
    condition     = endswith(var.origin_config_filename, ".js")
    error_message = "Filename must be a JavaScript file."
  }
}

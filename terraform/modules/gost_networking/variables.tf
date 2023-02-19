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

variable "vpc_ipv4_primary_cidr_block" {
  description = "Primary IPv4 CIDR block that should be used by the created VPC for subnet IP allocation."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zone name(s) where networking resources should be deployed. At least 2 are recommended for availability."
  validation {
    condition     = length(var.availability_zones) >= 1
    error_message = "A minimum of 1 AZ is required."
  }
}

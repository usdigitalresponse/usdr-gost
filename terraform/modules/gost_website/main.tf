data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

provider "aws" {
  region = "us-east-1"
  alias  = "us-east-1"
}

module "this" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  enabled   = var.enabled
  namespace = var.namespace
  tags      = var.tags
}

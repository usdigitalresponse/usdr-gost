data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

terraform {
  required_version = "1.3.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67.0"
    }
  }
}

module "this" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  namespace = var.namespace
  tags      = var.tags
}

data "aws_ecs_cluster" "default" {
  cluster_name = var.ecs_cluster_name
}

data "aws_kms_key" "ssm" {
  key_id = "alias/aws/ssm"
}

data "aws_cloudwatch_event_bus" "grants_ingest" {
  name = var.grants_ingest_event_bus_name
}

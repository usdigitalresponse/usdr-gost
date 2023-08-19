data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

terraform {
  required_providers {
    aws = "~> 4.67.0"
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

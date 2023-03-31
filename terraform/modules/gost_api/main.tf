data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

module "this" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  enabled   = var.enabled
  namespace = var.namespace
  tags      = var.tags
}

module "s3_label" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  context = module.this.context
  attributes = [
    data.aws_caller_identity.current.account_id,
    data.aws_region.current.name,
    "api",
  ]
}

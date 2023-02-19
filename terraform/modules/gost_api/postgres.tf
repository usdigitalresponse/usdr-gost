module "connect_to_postgres_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"
  context = module.this.context

  iam_policy_statements = {
    DBAccess = {
      effect    = "Allow"
      actions   = ["rds-db:connect"]
      resources = var.rds_db_connect_resources
    }
  }
}

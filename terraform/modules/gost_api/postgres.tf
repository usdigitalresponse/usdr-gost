module "connect_to_postgres_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "2.0.1"
  context = module.this.context

  iam_policy_statements = {
    DBAccess = {
      effect    = "Allow"
      actions   = ["rds-db:connect"]
      resources = var.rds_db_connect_resources
    }
  }
}

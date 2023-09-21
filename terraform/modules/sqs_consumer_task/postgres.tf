locals {
  // Note: No password; requires IAM auth
  postgres_connection_string = format(
    // e.g. "postgres://user@endpoint:port/dbname"
    "postgres://%s@%s:%s/%s",
    var.postgres_username,
    var.postgres_endpoint,
    var.postgres_port,
    var.postgres_db_name,
  )
}

module "connect_to_postgres_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  iam_policy = {
    statements = [
      {
        sid       = "DBAccess"
        effect    = "Allow"
        actions   = ["rds-db:connect"]
        resources = var.rds_db_connect_resources
      },
    ]
  }
}

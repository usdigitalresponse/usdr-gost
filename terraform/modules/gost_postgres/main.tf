data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

data "aws_rds_engine_version" "postgres13_8" {
  engine  = "aurora-postgresql"
  version = "13.8"
}

resource "aws_db_parameter_group" "postgres13" {
  name        = "${var.namespace}-aurora-postgres13-db"
  family      = "aurora-postgresql13"
  description = "RDS Aurora database instance parameter group for ${var.namespace} cluster members."
}

resource "aws_rds_cluster_parameter_group" "postgres13" {
  name        = "${var.namespace}-aurora-postgres13-cluster"
  family      = "aurora-postgresql13"
  description = "RDS Aurora cluster parameter group for ${var.namespace}."

  parameter {
    name  = "log_statement"
    value = var.query_logging_enabled ? "all" : "none"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.query_logging_enabled ? "1" : "-1"
  }
}

resource "random_password" "postgres_user" {
  length  = 32
  special = false
}

module "db" {
  create  = var.enabled
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "8.3.1"

  name                       = "${var.namespace}-postgres"
  cluster_use_name_prefix    = true
  engine                     = data.aws_rds_engine_version.postgres13_8.engine
  engine_version             = data.aws_rds_engine_version.postgres13_8.version
  auto_minor_version_upgrade = true
  engine_mode                = "provisioned"
  storage_encrypted          = true

  vpc_id                         = var.vpc_id
  subnets                        = var.subnet_ids
  create_security_group          = true
  create_db_subnet_group         = true
  security_group_use_name_prefix = true
  security_group_rules = {
    for k, security_group_id in var.ingress_security_groups : k => {
      type                     = "ingress"
      source_security_group_id = security_group_id
    }
  }

  db_parameter_group_name         = aws_db_parameter_group.postgres13.id
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.postgres13.id

  database_name                       = var.default_db_name
  master_username                     = "postgres"
  master_password                     = random_password.postgres_user.result
  manage_master_user_password         = false
  iam_database_authentication_enabled = true

  monitoring_interval           = 60 // seconds
  iam_role_name                 = "${var.namespace}-db-monitoring-"
  iam_role_use_name_prefix      = true
  iam_role_permissions_boundary = var.permissions_boundary_arn

  apply_immediately   = var.apply_changes_immediately
  skip_final_snapshot = var.snapshot_before_destroy
  deletion_protection = var.prevent_destroy

  serverlessv2_scaling_configuration = {
    min_capacity = 0.5
    max_capacity = 1.5
  }

  instance_class = "db.serverless"
  instances = {
    one = {}
  }
}

locals {
  connect_resource_base_arn = !var.enabled ? "" : join(":", [
    "arn",
    data.aws_partition.current.id,
    "rds-db",
    data.aws_region.current.id,
    data.aws_caller_identity.current.account_id,
    "dbuser",
    module.db.cluster_resource_id,
  ])

  connect_ids_for_iam_auth = !var.enabled ? [] : concat(
    [module.db.cluster_master_username],
    var.rds_db_connect_identifiers_for_iam_auth
  )

  db_connect_resources_map = {
    for id in local.connect_ids_for_iam_auth : id => "${local.connect_resource_base_arn}/${id}"
  }
}

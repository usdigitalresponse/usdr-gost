terraform {
  required_version = "1.3.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.52.0"
    }
  }

  backend "s3" {}
}

data "aws_iam_policy" "permissions_boundary" {
  name = var.permissions_boundary_policy_name
}

data "aws_ssm_parameter" "vpc_id" {
  name = "${var.ssm_path_prefix}/network/vpc_id"
}

data "aws_ssm_parameter" "private_subnet_ids" {
  name = "${var.ssm_path_prefix}/network/private_subnet_ids"
}

data "aws_ssm_parameter" "public_dns_zone_id" {
  name = "${var.ssm_path_prefix}/dns/public_zone_id"
}

module "website" {
  enabled                  = var.website_enabled
  source                   = "./modules/gost_website"
  namespace                = var.namespace
  permissions_boundary_arn = data.aws_iam_policy.permissions_boundary.arn

  dns_zone_id                          = data.aws_ssm_parameter.public_dns_zone_id.value
  domain_name                          = var.website_domain_name
  gost_api_domain                      = var.api_domain_name
  github_deployment                    = local.github_deployment_settings
  ssm_deployment_parameter_path_prefix = "${var.ssm_path_prefix}/deployment-config/website"
}

module "api_to_postgres_security_group" {
  enabled = var.api_enabled
  source  = "cloudposse/security-group/aws"
  version = "2.0.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["api", "postgres"]
  allow_all_egress = true
}

resource "aws_ecs_cluster" "default" {
  count = anytrue([var.api_enabled]) ? 1 : 0

  name = var.namespace

  setting {
    name  = "containerInsights"
    value = var.cluster_container_insights_enabled ? "enabled" : "disabled"
  }

  configuration {
    execute_command_configuration {
      logging = "DEFAULT"
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "default" {
  for_each = aws_ecs_cluster.default

  cluster_name       = aws_ecs_cluster.default[each.key].name
  capacity_providers = ["FARGATE"]
}

module "api" {
  enabled                  = var.api_enabled
  source                   = "./modules/gost_api"
  namespace                = var.namespace
  permissions_boundary_arn = data.aws_iam_policy.permissions_boundary.arn

  # Networking
  vpc_id             = data.aws_ssm_parameter.vpc_id.value
  subnet_ids         = data.aws_ssm_parameter.private_subnet_ids.value
  security_group_ids = [module.api_to_postgres_security_group.id]

  # Cluster
  ecs_cluster_id   = join("", aws_ecs_cluster.default.*.id)
  ecs_cluster_name = join("", aws_ecs_cluster.default.*.name)

  # Task configuration
  docker_tag                 = var.api_container_image_tag
  api_container_environment  = var.api_container_environment
  default_desired_task_count = var.api_default_desired_task_count
  enable_grants_scraper      = var.api_enable_grants_scraper

  # DNS
  domain_name         = var.api_domain_name
  dns_zone_id         = data.aws_ssm_parameter.public_dns_zone_id.value
  website_domain_name = var.website_domain_name

  # Logging
  log_retention = var.api_log_retention_in_days

  # Secrets
  ssm_path_prefix               = var.ssm_path_prefix
  datadog_api_key_parameter_arn = var.api_datadog_api_key_parameter_arn

  # Postgres
  rds_db_connect_resources = module.postgres.rds_db_connect_resources_list
  postgres_username        = module.postgres.master_username
  postgres_password        = module.postgres.master_password
  postgres_endpoint        = module.postgres.cluster_endpoint
  postgres_port            = module.postgres.cluster_port
  postgres_db_name         = module.postgres.default_db_name

  # Email
  notifications_email_address             = var.api_notifications_email_from_address
  notifications_email_domain_identity_arn = var.api_ses_domain_identity_arn
}

module "postgres" {
  enabled                  = var.postgres_enabled
  source                   = "./modules/gost_postgres"
  namespace                = var.namespace
  permissions_boundary_arn = data.aws_iam_policy.permissions_boundary.arn

  default_db_name           = "${var.namespace}-db"
  vpc_id                    = data.aws_ssm_parameter.vpc_id.value
  subnet_ids                = data.aws_ssm_parameter.private_subnet_ids.value
  allowed_security_groups   = [module.api_to_postgres_security_group.id]
  prevent_destroy           = var.postgres_prevent_destroy
  snapshot_before_destroy   = var.postgres_snapshot_before_destroy
  apply_changes_immediately = var.postgres_apply_changes_immediately
}

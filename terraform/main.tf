terraform {
  required_version = "1.3.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.61.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  default_tags {
    tags = {
      env        = var.env
      management = "terraform"
      owner      = "grants"
      repo       = "usdr-gost"
      service    = "gost"
      usage      = "workload"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "vpc_id" {
  name = "${var.ssm_deployment_parameters_path_prefix}/network/vpc_id"
}

data "aws_ssm_parameter" "private_subnet_ids" {
  name = "${var.ssm_deployment_parameters_path_prefix}/network/private_subnet_ids"
}

locals {
  private_subnet_ids       = split(",", data.aws_ssm_parameter.private_subnet_ids.value)
  permissions_boundary_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${var.permissions_boundary_policy_name}"
  api_domain_name          = coalesce(var.api_domain_name, "api.${var.website_domain_name}")
}


data "aws_ssm_parameter" "public_dns_zone_id" {
  name = "${var.ssm_deployment_parameters_path_prefix}/dns/public_zone_id"
}

module "website" {
  enabled                  = var.website_enabled
  source                   = "./modules/gost_website"
  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn

  dns_zone_id       = data.aws_ssm_parameter.public_dns_zone_id.value
  domain_name       = var.website_domain_name
  gost_api_domain   = local.api_domain_name
  managed_waf_rules = var.website_managed_waf_rules
}

module "api_to_postgres_security_group" {
  enabled = var.api_enabled
  source  = "cloudposse/security-group/aws"
  version = "2.0.1"

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
  count = length(aws_ecs_cluster.default.*)

  cluster_name       = aws_ecs_cluster.default[count.index].name
  capacity_providers = ["FARGATE"]
}

module "api" {
  enabled                  = var.api_enabled
  source                   = "./modules/gost_api"
  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn
  depends_on               = [aws_ecs_cluster.default]

  # Networking
  vpc_id             = data.aws_ssm_parameter.vpc_id.value
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.api_to_postgres_security_group.id]

  # Cluster
  ecs_cluster_id   = join("", aws_ecs_cluster.default.*.id)
  ecs_cluster_name = join("", aws_ecs_cluster.default.*.name)

  # Task configuration
  docker_tag                 = var.api_container_image_tag
  api_container_environment  = var.api_container_environment
  default_desired_task_count = var.api_default_desired_task_count
  enable_grants_scraper      = var.api_enable_grants_scraper
  enable_grants_digest       = var.api_enable_grants_digest

  # DNS
  domain_name         = local.api_domain_name
  dns_zone_id         = data.aws_ssm_parameter.public_dns_zone_id.value
  website_domain_name = var.website_domain_name

  # Logging
  log_retention = var.api_log_retention_in_days

  # Secrets
  ssm_path_prefix = var.ssm_service_parameters_path_prefix

  # Postgres
  rds_db_connect_resources = module.postgres.rds_db_connect_resources_list
  postgres_username        = module.postgres.master_username
  postgres_password        = module.postgres.master_password
  postgres_endpoint        = module.postgres.cluster_endpoint
  postgres_port            = module.postgres.cluster_port
  postgres_db_name         = module.postgres.default_db_name

  # Email
  notifications_email_address = "grants-notifications@${var.website_domain_name}"
}

module "postgres" {
  enabled                  = var.postgres_enabled
  source                   = "./modules/gost_postgres"
  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn

  default_db_name           = "gost"
  vpc_id                    = data.aws_ssm_parameter.vpc_id.value
  subnet_ids                = local.private_subnet_ids
  allowed_security_groups   = [module.api_to_postgres_security_group.id]
  prevent_destroy           = var.postgres_prevent_destroy
  snapshot_before_destroy   = var.postgres_snapshot_before_destroy
  apply_changes_immediately = var.postgres_apply_changes_immediately
}

// Deployment parameters
resource "aws_ssm_parameter" "deploy_api_cluster_name" {
  name        = "${var.ssm_deployment_parameters_path_prefix}/api/cluster-name"
  description = "Name of the ECS cluster to specify when forcing new deployments for the API."
  type        = "String"
  value       = module.api.ecs_cluster_name
}

resource "aws_ssm_parameter" "deploy_api_service_name" {
  name        = "${var.ssm_deployment_parameters_path_prefix}/api/service-name"
  description = "Name of the ECS service to specify when forcing new deployments for the API."
  type        = "String"
  value       = module.api.ecs_service_name
}

resource "aws_ssm_parameter" "deploy_website_s3_uri" {
  name        = "${var.ssm_deployment_parameters_path_prefix}/website/s3-uri"
  description = "Base URI for deploying website dist artifacts to the origin bucket."
  type        = "String"
  value       = module.website.s3_distribution_base_uri
}

resource "aws_ssm_parameter" "deploy_website_cloudfront_distribution_id" {
  name        = "${var.ssm_deployment_parameters_path_prefix}/website/distribution-id"
  description = "Base URI for deploying website dist artifacts to the origin bucket."
  type        = "String"
  value       = module.website.cloudfront_distribution_id
}

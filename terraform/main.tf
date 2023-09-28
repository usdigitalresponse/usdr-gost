terraform {
  required_version = "1.3.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67.0"
    }
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.29.0"
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

provider "datadog" {
  validate = can(coalesce(var.datadog_api_key)) && can(coalesce(var.datadog_app_key))
  api_key  = var.datadog_api_key
  app_key  = var.datadog_app_key
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
  unified_service_tags     = { service = "gost", env = var.env, version = var.version_identifier }
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
  feature_flags     = var.website_feature_flags
}

module "api_to_postgres_security_group" {
  enabled = var.api_enabled
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["api", "postgres"]
  allow_all_egress = true
}

module "consume_grants_to_postgres_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["consume_grants", "postgres"]
  allow_all_egress = true
}

module "arpa_audit_report_to_postgres_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["arpa_audit_report", "postgres"]
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
  vpc_id     = data.aws_ssm_parameter.vpc_id.value
  subnet_ids = local.private_subnet_ids
  security_group_ids = [
    module.consume_grants_to_postgres_security_group.id,
    module.arpa_audit_report_to_postgres_security_group.id,
  ]

  # Cluster
  ecs_cluster_id   = join("", aws_ecs_cluster.default.*.id)
  ecs_cluster_name = join("", aws_ecs_cluster.default.*.name)

  # Task configuration
  docker_tag                        = var.api_container_image_tag
  default_desired_task_count        = var.api_default_desired_task_count
  autoscaling_desired_count_minimum = var.api_minumum_task_count
  autoscaling_desired_count_maximum = var.api_maximum_task_count
  enable_grants_scraper             = var.api_enable_grants_scraper
  enable_grants_digest              = var.api_enable_grants_digest
  enable_saved_search_grants_digest = var.api_enable_saved_search_grants_digest
  unified_service_tags              = local.unified_service_tags
  datadog_environment_variables     = var.api_datadog_environment_variables
  api_container_environment = merge(var.api_container_environment, {
    ARPA_AUDIT_REPORT_SQS_QUEUE_URL = module.arpa_audit_report.sqs_queue_url
  })

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

module "consume_grants" {
  source                   = "./modules/gost_consume_grants"
  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn

  # Networking
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.api_to_postgres_security_group.id]

  # Task configuration
  ecs_cluster_name              = join("", aws_ecs_cluster.default.*.name)
  docker_tag                    = var.api_container_image_tag
  unified_service_tags          = local.unified_service_tags
  datadog_environment_variables = var.consume_grants_datadog_environment_variables

  # Messaging
  grants_ingest_event_bus_name = var.consume_grants_source_event_bus_name
  sqs_dlq_enabled              = true

  # Secrets
  ssm_path_prefix = var.ssm_service_parameters_path_prefix

  # Postgres
  rds_db_connect_resources = module.postgres.rds_db_connect_resources_list
  postgres_username        = module.postgres.master_username
  postgres_endpoint        = module.postgres.cluster_endpoint
  postgres_port            = module.postgres.cluster_port
  postgres_db_name         = module.postgres.default_db_name
}

data "aws_iam_policy_document" "arpa_audit_report_rw_reports_bucket" {
  statement {
    sid = "ReadWriteBucketObjects"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${module.api.arpa_audit_reports_bucket_arn}/*"]
  }
}

module "arpa_audit_report" {
  source                   = "./modules/sqs_consumer_task"
  namespace                = var.namespace
  name                     = "arpa_audit_report"
  permissions_boundary_arn = local.permissions_boundary_arn

  # Networking
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.api_to_postgres_security_group.id]

  # Task configuration
  ecs_cluster_name      = join("", aws_ecs_cluster.default.*.name)
  docker_tag            = var.api_container_image_tag
  unified_service_tags  = local.unified_service_tags
  stop_timeout_seconds  = 120
  consumer_task_command = ["node", "./src/scripts/arpaAuditReport.js"]
  consumer_task_size = {
    cpu    = 512
    memory = 2048
  }
  consumer_container_environment = {
    DATA_DIR            = "/var/data"
    NODE_OPTIONS        = "--max_old_space_size=1024"
    NOTIFICATIONS_EMAIL = "grants-notifications@${var.website_domain_name}"
    WEBSITE_DOMAIN      = "https://${var.website_domain_name}"
  }
  consumer_task_efs_volume_mounts = [{
    name            = "data"
    container_path  = "/var/data"
    read_only       = false
    file_system_id  = module.api.efs_data_volume_id
    access_point_id = module.api.efs_data_volume_access_point_id
  }]
  additional_task_role_json_policies = {
    rw-audit-reports-bucket = data.aws_iam_policy_document.arpa_audit_report_rw_reports_bucket.json
  }

  # Messaging
  autoscaling_message_thresholds = [1, 3, 5, 10, 20, 50]
  sqs_publisher = {
    principal_type       = "Service"
    principal_identifier = "ecs-tasks.amazonaws.com"
    source_arn           = module.api.ecs_service_arn
  }

  # Logging
  log_retention = var.api_log_retention_in_days

  # Secrets
  ssm_path_prefix = var.ssm_service_parameters_path_prefix

  # Postgres
  rds_db_connect_resources = module.postgres.rds_db_connect_resources_list
  postgres_username        = module.postgres.master_username
  postgres_endpoint        = module.postgres.cluster_endpoint
  postgres_port            = module.postgres.cluster_port
  postgres_db_name         = module.postgres.default_db_name
}

module "postgres" {
  enabled                  = var.postgres_enabled
  source                   = "./modules/gost_postgres"
  namespace                = var.namespace
  permissions_boundary_arn = local.permissions_boundary_arn

  default_db_name = "gost"
  vpc_id          = data.aws_ssm_parameter.vpc_id.value
  subnet_ids      = local.private_subnet_ids
  ingress_security_groups = {
    from_api               = module.api_to_postgres_security_group.id
    from_consume_grants    = module.consume_grants_to_postgres_security_group.id
    from_arpa_audit_report = module.arpa_audit_report_to_postgres_security_group.id
  }

  prevent_destroy           = var.postgres_prevent_destroy
  snapshot_before_destroy   = var.postgres_snapshot_before_destroy
  apply_changes_immediately = var.postgres_apply_changes_immediately
  query_logging_enabled     = var.postgres_query_logging_enabled
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

resource "aws_ssm_parameter" "deploy_consume_grants_cluster_name" {
  name        = "${var.ssm_deployment_parameters_path_prefix}/consume-grants/cluster-name"
  description = "Name of the ECS cluster to specify when forcing new deployments for the grants consumer."
  type        = "String"
  value       = module.consume_grants.ecs_cluster_name
}

resource "aws_ssm_parameter" "deploy_consume_grants_service_name" {
  name        = "${var.ssm_deployment_parameters_path_prefix}/consume-grants/service-name"
  description = "Name of the ECS service to specify when forcing new deployments for the grants consumer."
  type        = "String"
  value       = module.consume_grants.ecs_service_name
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

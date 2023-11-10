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
  origin_artifacts_dist_path = coalesce(
    var.website_origin_artifacts_dist_path, "${path.root}/../packages/client/dist"
  )
  google_tag_id = var.website_google_tag_id

  datadog_rum_enabled = var.website_datadog_rum_enabled
  datadog_rum_config = merge(var.website_datadog_rum_options, {
    applicationId       = "15db471e-2ccb-4d3c-a6bf-99b750d748f5"
    clientToken         = "pub50834fcc1999d53e546519b1a0f03934"
    site                = "datadoghq.com"
    service             = local.unified_service_tags.service
    env                 = local.unified_service_tags.env
    version             = local.unified_service_tags.version
    defaultPrivacyLevel = "mask"
    allowedTracingUrls  = ["https://${local.api_domain_name}"]
  })
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

module "arpa_audit_report_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["arpa_audit_report"]
  allow_all_egress = true
}

module "digest_email_get_grants_for_criteria_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["digest_email_get_grants"]
  allow_all_egress = true
}

module "digest_email_send_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["digest_email_send"]
  allow_all_egress = true
}


module "arpa_treasury_report_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = data.aws_ssm_parameter.vpc_id.value
  attributes       = ["arpa_treasury_report"]
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
  count = length(aws_ecs_cluster.default[*])

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
    module.arpa_audit_report_security_group.id,
    module.arpa_treasury_report_security_group.id,
  ]

  # Cluster
  ecs_cluster_id   = join("", aws_ecs_cluster.default[*].id)
  ecs_cluster_name = join("", aws_ecs_cluster.default[*].name)

  # Task configuration
  docker_tag                        = var.api_container_image_tag
  default_desired_task_count        = var.api_default_desired_task_count
  autoscaling_desired_count_minimum = var.api_minumum_task_count
  autoscaling_desired_count_maximum = var.api_maximum_task_count
  enable_grants_scraper             = var.api_enable_grants_scraper
  enable_grants_digest              = var.api_enable_grants_digest
  enable_new_team_terminology       = var.api_enable_new_team_terminology
  enable_my_profile                 = var.api_enable_my_profile
  enable_saved_search_grants_digest = var.api_enable_saved_search_grants_digest
  unified_service_tags              = local.unified_service_tags
  datadog_environment_variables     = var.api_datadog_environment_variables
  api_container_environment = merge(var.api_container_environment, {
    ARPA_AUDIT_REPORT_SQS_QUEUE_URL    = module.arpa_audit_report.sqs_queue_url
    ARPA_TREASURY_REPORT_SQS_QUEUE_URL = module.arpa_treasury_report.sqs_queue_url
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
  ecs_cluster_name              = join("", aws_ecs_cluster.default[*].name)
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
  namespace                = "${var.namespace}-arpa_audit_report"
  permissions_boundary_arn = local.permissions_boundary_arn

  # Networking
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.arpa_audit_report_security_group.id]

  # Task configuration
  ecs_cluster_name      = join("", aws_ecs_cluster.default[*].name)
  docker_tag            = var.api_container_image_tag
  unified_service_tags  = local.unified_service_tags
  stop_timeout_seconds  = 120
  consumer_task_command = ["node", "./src/scripts/arpaAuditReport.js"]
  consumer_container_environment = {
    API_DOMAIN          = "https://${local.api_domain_name}"
    AUDIT_REPORT_BUCKET = module.api.arpa_audit_reports_bucket_id
    DATA_DIR            = "/var/data"
    LOG_LEVEL           = "DEBUG"
    LOG_SRC_ENABLED     = "false"
    NODE_OPTIONS        = "--max_old_space_size=3584" # Reserve 512 MB for other task resources
    NOTIFICATIONS_EMAIL = "grants-notifications@${var.website_domain_name}"
    WEBSITE_DOMAIN      = "https://${var.website_domain_name}"
  }
  datadog_environment_variables = {
    DD_LOGS_INJECTION    = "true"
    DD_PROFILING_ENABLED = "true"
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
    send-emails             = module.api.send_emails_policy_json
  }

  # Task resource configuration
  # TODO: Tune these values after observing usage in different environments.
  #       See also: --max_old_space_size in NODE_OPTIONS env var.
  consumer_task_size = {
    cpu    = 1024 # 1 vCPU
    memory = 4096 # 4 GB
  }

  # Messaging
  autoscaling_message_thresholds = [1, 3, 5, 10, 20, 50]
  sqs_publisher = {
    principal_type       = "Service"
    principal_identifier = "ecs-tasks.amazonaws.com"
    source_arn           = module.api.ecs_service_arn
  }
  sqs_max_receive_count             = 2
  sqs_visibility_timeout_seconds    = 900     # 15 minutes, in seconds
  sqs_dlq_message_retention_seconds = 1209600 # 14 days, in seconds

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

data "aws_iam_policy_document" "publish_to_arpa_audit_report_queue" {
  statement {
    sid       = "AllowPublishToQueue"
    actions   = ["sqs:SendMessage"]
    resources = [module.arpa_audit_report.sqs_queue_arn]
  }
}

resource "aws_iam_role_policy" "api_task-publish_to_arpa_audit_report_queue" {
  name_prefix = "send-arpa-audit-report-requests"
  role        = module.api.ecs_task_role_name
  policy      = data.aws_iam_policy_document.publish_to_arpa_audit_report_queue.json
}

data "aws_iam_policy_document" "publish_to_digest_email_get_grants" {
  statement {
    sid       = "AllowPublishToQueue"
    actions   = ["sqs:SendMessage"]
    resources = [module.digest_email_get_grants.sqs_queue_arn]
  }
}

resource "aws_iam_role_policy" "digest_email_kickoff_cron-publish_to_digest_email_get_grants_queue" {
  name_prefix = "send-digest-email-get-grants-requests"
  role        = module.api.ecs_task_role_name
  policy      = data.aws_iam_policy_document.publish_to_digest_email_send_queue.json
}

module "digest_email_get_grants" {
  source                   = "./modules/sqs_consumer_task"
  namespace                = "${var.namespace}-digest_get_grants"
  permissions_boundary_arn = local.permissions_boundary_arn

  # Networking
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.digest_email_get_grants_for_criteria_security_group.id]

  # Task configuration
  ecs_cluster_name      = join("", aws_ecs_cluster.default.*.name)
  docker_tag            = var.api_container_image_tag
  unified_service_tags  = local.unified_service_tags
  stop_timeout_seconds  = 120
  consumer_task_command = ["node", "./src/scripts/getGrantsAndUsers.js"]
  consumer_container_environment = {
    API_DOMAIN          = local.api_domain_name
    DATA_DIR            = "/var/data"
    NODE_OPTIONS        = "--max_old_space_size=400"
    NOTIFICATIONS_EMAIL = "grants-notifications@${var.website_domain_name}"
    WEBSITE_DOMAIN      = "https://${var.website_domain_name}"
  }

  # Task resource configuration
  # TODO: Tune these values after observing usage in different environments.
  #       See also: --max_old_space_size in NODE_OPTIONS env var.
  consumer_task_size = {
    cpu    = 256 # .25 vCPU
    memory = 512 # MB
  }

  # Messaging
  autoscaling_message_thresholds = [200, 500, 1000, 2000, 5000, 10000]
  sqs_publisher = {
    principal_type       = "Service"
    principal_identifier = "ecs-tasks.amazonaws.com"
    source_arn           = module.api.ecs_service_arn
  }
  sqs_max_receive_count             = 2
  sqs_dlq_message_retention_seconds = 1209600 # 14 days, in seconds

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

data "aws_iam_policy_document" "publish_to_digest_email_send_queue" {
  statement {
    sid       = "AllowPublishToQueue"
    actions   = ["sqs:SendMessage"]
    resources = [module.digest_email_send.sqs_queue_arn]
  }
}

resource "aws_iam_role_policy" "digest_email_get_grants-publish_to_digest_email_send_queue" {
  name_prefix = "send-digest-email-send-requests"
  role        = module.digest_email_get_grants.iam_task_role_name
  policy      = data.aws_iam_policy_document.publish_to_digest_email_send_queue.json
}

module "digest_email_send" {
  source                   = "./modules/sqs_consumer_task"
  namespace                = "${var.namespace}-digest_email_send"
  permissions_boundary_arn = local.permissions_boundary_arn

  # Networking
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.digest_email_send_security_group.id]

  # Task configuration
  ecs_cluster_name      = join("", aws_ecs_cluster.default.*.name)
  docker_tag            = var.api_container_image_tag
  unified_service_tags  = local.unified_service_tags
  stop_timeout_seconds  = 120
  consumer_task_command = ["node", "./src/lib/digest/sendEmail.js"]
  consumer_container_environment = {
    API_DOMAIN          = local.api_domain_name
    DATA_DIR            = "/var/data"
    NODE_OPTIONS        = "--max_old_space_size=3584" # Reserve 512 MB for other task resources
    NOTIFICATIONS_EMAIL = "grants-notifications@${var.website_domain_name}"
    WEBSITE_DOMAIN      = "https://${var.website_domain_name}"
  }

  additional_task_role_json_policies = {
    send-emails = module.api.send_emails_policy_json
  }

  # Task resource configuration
  # TODO: Tune these values after observing usage in different environments.
  #       See also: --max_old_space_size in NODE_OPTIONS env var.
  consumer_task_size = {
    cpu    = 256 # .25 vCPU
    memory = 512 # MB
  }

  # Messaging
  autoscaling_message_thresholds = [100, 200, 400, 600, 800, 1000, 5000, 10000]
  sqs_publisher = {
    principal_type       = "Service"
    principal_identifier = "ecs-tasks.amazonaws.com"
    source_arn           = module.api.ecs_service_arn
  }
  sqs_max_receive_count             = 1
  sqs_dlq_message_retention_seconds = 1209600 # 14 days, in seconds

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

module "arpa_treasury_report" {
  source                   = "./modules/sqs_consumer_task"
  namespace                = "${var.namespace}-treasury_report"
  permissions_boundary_arn = local.permissions_boundary_arn

  # Networking
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.arpa_treasury_report_security_group.id]

  # Task configuration
  ecs_cluster_name      = join("", aws_ecs_cluster.default[*].name)
  docker_tag            = var.api_container_image_tag
  unified_service_tags  = local.unified_service_tags
  stop_timeout_seconds  = 120
  consumer_task_command = ["node", "./src/scripts/arpaTreasuryReport.js"]
  consumer_container_environment = {
    API_DOMAIN          = "https://${local.api_domain_name}"
    AUDIT_REPORT_BUCKET = module.api.arpa_audit_reports_bucket_id
    DATA_DIR            = "/var/data"
    LOG_LEVEL           = "DEBUG"
    LOG_SRC_ENABLED     = "false"
    NODE_OPTIONS        = "--max_old_space_size=3584" # Reserve 512 MB for other task resources
    NOTIFICATIONS_EMAIL = "grants-notifications@${var.website_domain_name}"
    WEBSITE_DOMAIN      = "https://${var.website_domain_name}"
  }
  datadog_environment_variables = {
    DD_LOGS_INJECTION    = "true"
    DD_PROFILING_ENABLED = "true"
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
    send-emails             = module.api.send_emails_policy_json
  }

  # Task resource configuration
  # TODO: Tune these values after observing usage in different environments.
  #       See also: --max_old_space_size in NODE_OPTIONS env var.
  consumer_task_size = {
    cpu    = 1024 # 1 vCPU
    memory = 4096 # 4 GB
  }

  # Messaging
  autoscaling_message_thresholds = [1, 3, 5, 10, 20, 50]
  sqs_publisher = {
    principal_type       = "Service"
    principal_identifier = "ecs-tasks.amazonaws.com"
    source_arn           = module.api.ecs_service_arn
  }
  sqs_max_receive_count             = 2
  sqs_visibility_timeout_seconds    = 900     # 15 minutes, in seconds
  sqs_dlq_message_retention_seconds = 1209600 # 14 days, in seconds

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

data "aws_iam_policy_document" "publish_to_arpa_treasury_report_queue" {
  statement {
    sid       = "AllowPublishToQueue"
    actions   = ["sqs:SendMessage"]
    resources = [module.arpa_treasury_report.sqs_queue_arn]
  }
}

resource "aws_iam_role_policy" "api_task-publish_to_arpa_treasury_report_queue" {
  name_prefix = "send-arpa-treasury-report-requests"
  role        = module.api.ecs_task_role_name
  policy      = data.aws_iam_policy_document.publish_to_arpa_treasury_report_queue.json
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
    from_api                  = module.api_to_postgres_security_group.id
    from_consume_grants       = module.consume_grants_to_postgres_security_group.id
    from_arpa_audit_report    = module.arpa_audit_report_security_group.id
    from_digest_kickoff       = module.api.digest_email_kickoff_cron_security_group_id
    from_digest_get_grants    = module.digest_email_get_grants_for_criteria_security_group.id
    from_digest_send_email    = module.digest_email_send_security_group.id
    from_arpa_treasury_report = module.arpa_treasury_report_security_group.id
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

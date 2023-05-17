locals {
  api_container_image = "${var.docker_repository}:${var.docker_tag}"
  api_container_port  = 3000

  datadog_env_vars = {
    for k in compact([for k, v in var.unified_service_tags : (v != null ? k : "")]) :
    "DD_${upper(k)}" => var.unified_service_tags[k]
  }
  datadog_docker_labels = {
    for k in compact([for k, v in var.unified_service_tags : (v != null ? k : "")]) :
    "com.datadoghq.tags.${lower(k)}" => var.unified_service_tags[k]
  }
}

module "api_container_definition" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.59.0"

  container_name           = "api"
  container_image          = local.api_container_image
  essential                = true
  readonly_root_filesystem = "false"

  linux_parameters = {
    capabilities = {
      add  = []
      drop = []
    }
    devices            = []
    initProcessEnabled = true
    maxSwap            = null
    sharedMemorySize   = null
    swappiness         = null
    tmpfs              = []
  }

  map_environment = merge(
    {
      API_DOMAIN                = "https://${var.domain_name}"
      AUDIT_REPORT_BUCKET       = module.arpa_audit_reports_bucket.bucket_id
      DATA_DIR                  = "/var/data"
      ENABLE_GRANTS_DIGEST      = var.enable_grants_digest ? "true" : "false"
      ENABLE_GRANTS_SCRAPER     = "false"
      GRANTS_SCRAPER_DATE_RANGE = 7
      GRANTS_SCRAPER_DELAY      = 1000
      NODE_OPTIONS              = "--max_old_space_size=1024"
      NOTIFICATIONS_EMAIL       = var.notifications_email_address
      PGSSLROOTCERT             = "rds-combined-ca-bundle.pem"
      VUE_APP_GRANTS_API_URL    = module.api_gateway.apigatewayv2_api_api_endpoint
      WEBSITE_DOMAIN            = "https://${var.website_domain_name}"
    },
    local.datadog_env_vars,
    var.api_container_environment,
  )

  map_secrets = {
    COOKIE_SECRET = join("", aws_ssm_parameter.cookie_secret.*.arn)
    POSTGRES_URL  = join("", aws_ssm_parameter.postgres_connection_string.*.arn)
  }

  docker_labels = local.datadog_docker_labels

  port_mappings = [{
    containerPort = local.api_container_port
    hostPort      = local.api_container_port
    protocol      = "tcp"
  }]

  mount_points = [
    {
      sourceVolume  = "data"
      containerPath = "/var/data"
      readOnly      = false
    }
  ]

  log_configuration = {
    logDriver = "awslogs"
    options = {
      awslogs-group         = join("", aws_cloudwatch_log_group.default.*.name)
      awslogs-region        = data.aws_region.current.name
      awslogs-stream-prefix = "ecs"
    }
  }
}

module "datadog_container_definition" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.59.0"

  container_name           = "datadog"
  container_image          = "public.ecr.aws/datadog/agent:latest"
  essential                = false
  readonly_root_filesystem = "false"
  stop_timeout             = 60

  map_environment = merge(
    {
      ECS_FARGATE    = "true",
      DD_APM_ENABLED = "true",
    },
    local.datadog_env_vars,
  )
  map_secrets = {
    DD_API_KEY = join("", data.aws_ssm_parameter.datadog_api_key.*.arn),
  }
  docker_labels = local.datadog_docker_labels
}

resource "aws_iam_role" "execution" {
  count = var.enabled ? 1 : 0

  name_prefix          = "${var.namespace}-api-ECSTaskExecution-"
  permissions_boundary = var.permissions_boundary_arn
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "execution" {
  for_each = !var.enabled ? {} : {
    decrypt-secrets = module.decrypt_secrets_policy.json
    write-api-logs  = module.write_api_logs_policy.json
  }

  name   = each.key
  role   = join("", aws_iam_role.execution.*.name)
  policy = each.value
}

resource "aws_ecs_task_definition" "default" {
  count = var.enabled ? 1 : 0

  family                   = "${var.namespace}-api"
  execution_role_arn       = join("", aws_iam_role.execution.*.arn)
  task_role_arn            = join("", aws_iam_role.task.*.arn)
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  # Valid configurations here:
  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html#fargate-tasks-size
  cpu    = 256
  memory = 512

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    module.api_container_definition.json_map_object,
    module.datadog_container_definition.json_map_object,
  ])

  volume {
    name = "data"
    efs_volume_configuration {
      file_system_id     = module.efs_data_volume.id
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = module.efs_data_volume.access_point_ids["data"]
      }
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "task" {
  count = var.enabled ? 1 : 0

  name_prefix          = "${var.namespace}-api-ECSTask-"
  permissions_boundary = var.permissions_boundary_arn
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Condition = {
          ArnLike = {
            "aws:SourceArn" = "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*",
          },
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "task" {
  for_each = !var.enabled ? {} : {
    connect-to-postgres   = module.connect_to_postgres_policy.json
    ecs-exec              = module.ecs_exec_policy.json
    send-emails           = module.send_emails_policy.json
    rw-arpa-audit-reports = module.access_arpa_reports_bucket_policy.json
  }

  name   = each.key
  role   = join("", aws_iam_role.task.*.name)
  policy = each.value
}

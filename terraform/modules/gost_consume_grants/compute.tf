locals {
  stop_timeout_seconds = 120
}

resource "aws_ecs_service" "default" {
  name                   = "${var.namespace}-consume_grants"
  cluster                = data.aws_ecs_cluster.default.id
  task_definition        = aws_ecs_task_definition.consume_grants.arn
  desired_count          = 0
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    security_groups  = compact(var.security_group_ids)
    subnets          = compact(var.subnet_ids)
    assign_public_ip = false
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [
    aws_iam_role.execution,
    aws_iam_role_policy.execution,
  ]
}

module "consumer_container_definition" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.60.0"

  container_name           = "consumer"
  container_image          = "${var.docker_repository}:${var.docker_tag}"
  essential                = true
  readonly_root_filesystem = "false"
  stop_timeout             = local.stop_timeout_seconds
  command                  = ["node", "./src/scripts/consumeGrantModifications.js"]

  container_depends_on = [{
    containerName = "datadog"
    condition     = "START"
  }]

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
      GRANTS_INGEST_EVENTS_QUEUE_URL = module.sqs_queue.queue_url
      NODE_OPTIONS                   = "--max_old_space_size=200"
      PGSSLROOTCERT                  = "rds-combined-ca-bundle.pem"
      POSTGRES_URL                   = local.postgres_connection_string
    },
    local.datadog_env_vars,
    var.consumer_container_environment,
  )

  docker_labels = local.datadog_docker_labels

  log_configuration = {
    logDriver = "awslogs"
    options = {
      awslogs-group         = aws_cloudwatch_log_group.default.name
      awslogs-region        = data.aws_region.current.name
      awslogs-stream-prefix = "ecs"
    }
  }
}

module "datadog_container_definition" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.60.0"

  container_name           = "datadog"
  container_image          = "public.ecr.aws/datadog/agent:latest"
  essential                = false
  readonly_root_filesystem = "false"
  stop_timeout             = local.stop_timeout_seconds

  map_environment = merge(
    {
      ECS_FARGATE    = "true",
      DD_APM_ENABLED = "true",
    },
    local.datadog_env_vars,
  )
  map_secrets = {
    DD_API_KEY = data.aws_ssm_parameter.datadog_api_key.arn
  }
  docker_labels = local.datadog_docker_labels
}

resource "aws_ecs_task_definition" "consume_grants" {
  family                   = "${var.namespace}-consume_grants"
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
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
    module.consumer_container_definition.json_map_object,
    module.datadog_container_definition.json_map_object,
  ])

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "execution" {
  name_prefix          = "${var.namespace}-consume_grants-ECS-"
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
  for_each = {
    decrypt-datadog-api-key = module.decrypt_datadog_api_key_policy.json
    write-logs              = module.write_logs_policy.json
  }

  name   = each.key
  role   = aws_iam_role.execution.name
  policy = each.value
}

resource "aws_iam_role" "task" {
  name_prefix          = "${var.namespace}-consume_grants-ECSTask-"
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

module "ecs_exec_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  iam_policy_statements = {
    AllowExec = {
      effect = "Allow"
      actions = [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel"
      ]
      resources = ["*"]
    }

    InventoryLogGroupsForExec = {
      effect    = "Allow"
      actions   = ["logs:DescribeLogGroups"]
      resources = ["*"]
    }
  }
}

resource "aws_iam_role_policy" "task" {
  for_each = {
    connect-to-postgres  = module.connect_to_postgres_policy.json
    ecs-exec             = module.ecs_exec_policy.json
    write-logs           = module.write_logs_policy.json
    consume-sqs-messages = module.consume_sqs_messages_policy.json
  }

  name   = each.key
  role   = aws_iam_role.task.name
  policy = each.value
}

resource "aws_appautoscaling_target" "desired_count" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${data.aws_ecs_cluster.default.cluster_name}/${aws_ecs_service.default.name}"

  min_capacity = 0
  max_capacity = 4
}

resource "aws_appautoscaling_policy" "sqs_scale_up_ecs_tasks" {
  name        = "${var.namespace}-consume_grants-sqs-scale_up"
  policy_type = "StepScaling"

  scalable_dimension = aws_appautoscaling_target.desired_count.scalable_dimension
  resource_id        = aws_appautoscaling_target.desired_count.id
  service_namespace  = aws_appautoscaling_target.desired_count.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ExactCapacity"
    metric_aggregation_type = "Average"
    cooldown                = 180 # 3 minutes, in seconds

    step_adjustment {
      scaling_adjustment          = 1
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 100
    }

    step_adjustment {
      scaling_adjustment          = 2
      metric_interval_lower_bound = 100
      metric_interval_upper_bound = 500
    }

    step_adjustment {
      scaling_adjustment          = 3
      metric_interval_lower_bound = 500
      metric_interval_upper_bound = 1000
    }

    step_adjustment {
      scaling_adjustment          = 4
      metric_interval_lower_bound = 1000
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "sqs_scale_up_ecs_tasks" {
  alarm_name        = "${var.namespace}-consume_grants-SQS-ScaleUp-Tasks"
  alarm_description = "Increases tasks consuming grant modifications based on source queue size."
  alarm_actions     = [aws_appautoscaling_policy.sqs_scale_up_ecs_tasks.arn]

  period             = 60 # Seconds
  evaluation_periods = 1

  namespace           = "AWS/SQS"
  dimensions          = { QueueName = module.sqs_queue.queue_name }
  metric_name         = "ApproximateNumberOfMessagesVisible"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 1
  statistic           = "Sum"
}

resource "aws_appautoscaling_policy" "sqs_scale_down_ecs_tasks" {
  name        = "${var.namespace}-consume_grants-sqs-scale_down"
  policy_type = "StepScaling"

  scalable_dimension = aws_appautoscaling_target.desired_count.scalable_dimension
  resource_id        = aws_appautoscaling_target.desired_count.id
  service_namespace  = aws_appautoscaling_target.desired_count.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ExactCapacity"
    metric_aggregation_type = "Average"

    step_adjustment {
      scaling_adjustment          = 0
      metric_interval_upper_bound = 0
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "sqs-scale_down_tasks" {
  alarm_name        = "${var.namespace}-consume_grants-SQS-ScaleDown-Tasks"
  alarm_description = "Decreases tasks consuming grant modifications based on source queue size."
  alarm_actions     = [aws_appautoscaling_policy.sqs_scale_down_ecs_tasks.arn]

  period             = 60 # Seconds
  evaluation_periods = 1

  namespace           = "AWS/SQS"
  dimensions          = { QueueName = module.sqs_queue.queue_name }
  metric_name         = "ApproximateNumberOfMessagesVisible"
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  statistic           = "Sum"
}

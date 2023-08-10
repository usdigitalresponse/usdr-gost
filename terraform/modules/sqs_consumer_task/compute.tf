locals {
  ecs_service_name = var.namespace
}

resource "aws_ecs_service" "default" {
  name                   = local.ecs_service_name
  cluster                = data.aws_ecs_cluster.default.id
  task_definition        = aws_ecs_task_definition.consumer.arn
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

module "consumer_task_definition" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.60.0"

  container_name           = "consumer"
  container_image          = "${var.docker_repository}:${var.docker_tag}"
  essential                = true
  readonly_root_filesystem = "false"
  stop_timeout             = var.stop_timeout_seconds
  command                  = var.consumer_task_command

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
      ENABLE_GRANTS_DIGEST  = "false"
      ENABLE_GRANTS_SCRAPER = "false"
      NODE_OPTIONS          = "--max_old_space_size=200"
      PGSSLROOTCERT         = "rds-combined-ca-bundle.pem"
      POSTGRES_URL          = local.postgres_connection_string
    },
    local.datadog_env_vars,
    var.consumer_container_environment,
    { "${var.queue_url_environment_variable_name}" = module.sqs_queue.queue_url },
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
  container_image          = "public.ecr.aws/datadog/agent:${var.datadog_agent_image_tag}" # latest
  essential                = false
  readonly_root_filesystem = "false"
  stop_timeout             = var.stop_timeout_seconds

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

resource "aws_ecs_task_definition" "consumer" {
  family                   = local.ecs_service_name
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
    module.consumer_task_definition.json_map_object,
    module.datadog_container_definition.json_map_object,
  ])

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "execution" {
  name_prefix          = "${var.namespace}-ECSExec-"
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
  name_prefix          = "${var.namespace}-ECSTask-"
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
  for_each = merge(
    {
      connect-to-postgres  = module.connect_to_postgres_policy.json
      ecs-exec             = module.ecs_exec_policy.json
      write-logs           = module.write_logs_policy.json
      consume-sqs-messages = module.consume_sqs_messages_policy.json
    },
    var.additional_task_role_json_policies
  )

  name   = each.key
  role   = aws_iam_role.task.name
  policy = each.value
}

resource "aws_appautoscaling_target" "desired_count" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${data.aws_ecs_cluster.default.cluster_name}/${aws_ecs_service.default.name}"

  min_capacity = 0
  max_capacity = length(var.autoscaling_message_thresholds) + 1
}

locals {
  autoscaling_message_thresholds = concat(
    [for i in sort(var.autoscaling_message_thresholds) : tonumber(i)],
    [null]
  )
}

resource "aws_appautoscaling_policy" "sqs_scale_up_ecs_tasks" {
  name        = "${var.namespace}-sqs-scale_up"
  policy_type = "StepScaling"

  scalable_dimension = aws_appautoscaling_target.desired_count.scalable_dimension
  resource_id        = aws_appautoscaling_target.desired_count.id
  service_namespace  = aws_appautoscaling_target.desired_count.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ExactCapacity"
    metric_aggregation_type = "Average"
    cooldown                = var.autoscaling_scale_up_cooldown_seconds

    dynamic "step_adjustment" {
      for_each = [
        for i, v in local.autoscaling_message_thresholds : {
          adjustment = i + 1
          lower      = i == 0 ? 0 : local.autoscaling_message_thresholds[i - 1]
          upper      = v
        }
      ]
      iterator = each
      content {
        scaling_adjustment          = each.value.adjustment
        metric_interval_lower_bound = each.value.lower
        metric_interval_upper_bound = each.value.upper
      }
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "sqs_scale_up_ecs_tasks" {
  alarm_name        = "${var.namespace}-SQS-ScaleUp-Tasks"
  alarm_description = "Increases tasks based on source queue size."
  alarm_actions     = [aws_appautoscaling_policy.sqs_scale_up_ecs_tasks.arn]

  period             = var.autoscaling_scale_up_evaluation_period_seconds
  evaluation_periods = var.scale_up_evaluation_periods

  namespace           = "AWS/SQS"
  dimensions          = { QueueName = module.sqs_queue.queue_name }
  metric_name         = "ApproximateNumberOfMessagesVisible"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 1
  statistic           = "Sum"
}

resource "aws_appautoscaling_policy" "sqs_scale_down_ecs_tasks" {
  name        = "${var.namespace}-sqs-scale_down"
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
  alarm_name        = "${var.namespace}-SQS-ScaleDown-Tasks"
  alarm_description = "Decreases tasks based on source queue size."
  alarm_actions     = [aws_appautoscaling_policy.sqs_scale_down_ecs_tasks.arn]

  period             = var.autoscaling_scale_down_evaluation_period_seconds
  evaluation_periods = var.scale_down_evaluation_periods

  namespace           = "AWS/SQS"
  dimensions          = { QueueName = module.sqs_queue.queue_name }
  metric_name         = "ApproximateNumberOfMessagesVisible"
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  statistic           = "Sum"
}

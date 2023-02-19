data "aws_caller_identity" "current" { count = var.enabled ? 1 : 0 }

locals {
  create_role = var.enabled && var.role_arn == null

  task_revision_arn = var.task_revision == null ? var.task_definition_arn : replace(
    var.task_definition_arn,
    "/:\\d+$/",
    ":${var.task_revision == "LATEST" ? "*" : var.task_revision}"
  )

  flexible_time_window_minutes = sum([
    coalesce(lookup(coalesce(var.flexible_time_window, {}), "hours", 0), 0) * 60,
    coalesce(lookup(coalesce(var.flexible_time_window, {}), "minutes", 0), 0),
  ])

  retry_policy_max_event_age_seconds = sum([
    coalesce(lookup(coalesce(var.retry_policy_max_event_age, {}), "hours", 0), 0) * 60 * 60,
    coalesce(lookup(coalesce(var.retry_policy_max_event_age, {}), "minutes", 0), 0) * 60,
    coalesce(lookup(coalesce(var.retry_policy_max_event_age, {}), "seconds", 0), 0),
  ])
  retry_policy_enabled = anytrue([
    var.retry_policy_max_event_age != null,
    var.retry_policy_max_attempts != null,
  ])
}

resource "aws_iam_role" "default" {
  count = local.create_role ? 1 : 0

  name_prefix          = var.name_prefix
  description          = var.description
  permissions_boundary = var.permissions_boundary_arn
  assume_role_policy   = data.aws_iam_policy_document.trust[count.index].json
}

data "aws_iam_policy_document" "trust" {
  count = local.create_role ? 1 : 0

  statement {
    sid     = "AssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = data.aws_caller_identity.current.*.account_id
    }
  }
}

data "aws_iam_policy_document" "permissions" {
  count = local.create_role ? 1 : 0

  statement {
    sid       = "AllowRunTask"
    effect    = "Allow"
    actions   = ["ecs:RunTask"]
    resources = [local.task_revision_arn]

    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = [var.cluster_arn]
    }
  }

  statement {
    sid     = "AllowSchedulerPassRoleToExecutionRole"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      var.task_execution_role_arn,
      var.task_role_arn,
    ]
  }

  dynamic "statement" {
    for_each = var.sqs_dlq_arn == null ? [] : [1]
    content {
      sid       = "AllowDLQSendMessage"
      effect    = "Allow"
      actions   = ["sqs:SendMessage"]
      resources = [var.sqs_dlq_arn]
    }
  }
}

resource "aws_iam_role_policy" "default" {
  count = local.create_role ? 1 : 0

  role   = aws_iam_role.default[count.index].id
  policy = data.aws_iam_policy_document.permissions[count.index].json
}

resource "aws_scheduler_schedule" "default" {
  count = var.enabled ? 1 : 0

  name_prefix                  = var.name_prefix
  description                  = var.description
  group_name                   = var.scheduler_group_name
  state                        = var.schedule_enabled ? "ENABLED" : "DISABLED"
  schedule_expression          = var.schedule_expression
  schedule_expression_timezone = var.schedule_expression_timezone
  start_date                   = var.start_date
  end_date                     = var.end_date

  flexible_time_window {
    mode                      = var.flexible_time_window == null ? "OFF" : "FLEXIBLE"
    maximum_window_in_minutes = var.flexible_time_window == null ? null : local.flexible_time_window_minutes
  }

  target {
    arn      = var.cluster_arn
    role_arn = coalesce(var.role_arn, join("", aws_iam_role.default.*.arn))

    input = var.task_override

    dynamic "dead_letter_config" {
      for_each = var.sqs_dlq_arn == null ? [] : [1]
      content {
        arn = var.sqs_dlq_arn
      }
    }

    ecs_parameters {
      task_definition_arn     = var.task_definition_arn
      enable_ecs_managed_tags = var.enable_ecs_managed_tags
      enable_execute_command  = var.enable_execute_command
      group                   = var.group
      launch_type             = var.launch_type
      platform_version        = var.platform_version
      propagate_tags          = var.should_propagate_tags ? "TASK_DEFINITION" : null
      reference_id            = var.reference_id
      task_count              = var.task_count
      tags                    = var.task_tags

      dynamic "capacity_provider_strategy" {
        for_each = var.capacity_provider_strategies
        iterator = it
        content {
          base              = it.value["base"]
          capacity_provider = it.value["capacity_provider"]
          weight            = it.value["weight"]
        }
      }

      dynamic "network_configuration" {
        for_each = var.network_configuration == null ? [] : [1]
        content {
          assign_public_ip = var.network_configuration.assign_public_ip
          security_groups  = var.network_configuration.security_groups
          subnets          = var.network_configuration.subnets
        }
      }

      dynamic "placement_constraints" {
        for_each = var.placement_constraints
        iterator = it
        content {
          type       = it.value["type"]
          expression = it.value["expression"]
        }
      }

      dynamic "placement_strategy" {
        for_each = var.placement_strategies
        iterator = it
        content {
          type  = it.value["type"]
          field = it.value["field"]
        }
      }
    }

    dynamic "retry_policy" {
      for_each = local.retry_policy_enabled ? [1] : []
      content {
        maximum_event_age_in_seconds = var.retry_policy_max_event_age == null ? null : local.retry_policy_max_event_age_seconds
        maximum_retry_attempts       = var.retry_policy_max_attempts
      }
    }
  }
}

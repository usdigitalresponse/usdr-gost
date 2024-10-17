module "grant_activity_digest_scheduled_task" {
  source  = "../scheduled_ecs_task"
  enabled = var.enabled && var.enable_grant_activity_digest_scheduled_task

  name_prefix = "${var.namespace}-grant-activ-digest-task"
  description = "Executes an ECS task that sends grants activity digest emails at 8am ET"

  # Schedule
  schedule_expression          = "cron(0 8 * * *)"
  schedule_expression_timezone = "America/New_York"
  flexible_time_window         = { hours = 1 }
  # Until we have more robust email retry handling, we'll limit to 1 attempt to avoid sending multiple duplicate emails to a portion of the audience
  retry_policy_max_attempts  = 1
  retry_policy_max_event_age = { hours = 4 }

  // Permissions
  task_role_arn            = join("", aws_ecs_task_definition.default[*].task_role_arn)
  task_execution_role_arn  = join("", aws_ecs_task_definition.default[*].execution_role_arn)
  permissions_boundary_arn = var.permissions_boundary_arn

  // Task settings
  cluster_arn             = join("", data.aws_ecs_cluster.default[*].arn)
  task_definition_arn     = join("", aws_ecs_task_definition.default[*].arn)
  task_revision           = "LATEST"
  launch_type             = "FARGATE"
  enable_ecs_managed_tags = true
  enable_execute_command  = false

  task_override = jsonencode({
    containerOverrides = [
      {
        name = "api"
        command = [
          "node",
          "./src/scripts/sendGrantActivityDigestEmail.js"
        ]
      },
    ]
  })

  network_configuration = {
    assign_public_ip = false
    security_groups  = var.security_group_ids
    subnets          = var.subnet_ids
  }
}

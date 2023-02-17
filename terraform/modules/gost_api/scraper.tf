data "aws_ecs_cluster" "default" {
  count = var.enabled ? 1 : 0

  cluster_name = var.ecs_cluster_name
}

module "grants_scraper" {
  source  = "../scheduled_ecs_task"
  enabled = var.enabled && var.enable_grants_scraper

  name_prefix = "${var.namespace}-grants_scraper-"
  description = "Executes an ECS task that scrapes grants data daily, between 1:30am - 2:30am ET."

  // Schedule
  schedule_expression          = "cron(30 1 * * ? *)"
  schedule_expression_timezone = "America/New_York"
  flexible_time_window         = { hours = 1 }
  retry_policy_max_attempts    = 10
  retry_policy_max_event_age   = { hours = 4 }

  // Permissions
  task_role_arn            = join("", aws_ecs_task_definition.default.*.task_role_arn)
  task_execution_role_arn  = join("", aws_ecs_task_definition.default.*.execution_role_arn)
  permissions_boundary_arn = var.permissions_boundary_arn

  // Task settings
  cluster_arn             = join("", data.aws_ecs_cluster.default.*.arn)
  task_definition_arn     = join("", aws_ecs_task_definition.default.*.arn)
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
          "-e",
          "require('./src/lib/grantscraper').run().then(() => { process.exit(0); }).catch((err) => { console.log(err); process.exit(1); });"
        ]
        environment = [
          {
            name  = "ENABLE_GRANTS_SCRAPER",
            value = "true"
          },
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

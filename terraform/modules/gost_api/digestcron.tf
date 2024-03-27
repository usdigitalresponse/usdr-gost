module "digest_email_kickoff_cron" {
  source  = "../scheduled_ecs_task"
  enabled = var.enabled && var.enable_digest_email_criteria_cron

  name_prefix = "${var.namespace}-digest-cron-"
  description = "Executes an ECS task that kicks-off the grants email digest send daily, between 9am - 10am ET."

  // Schedule
  schedule_expression          = "cron(0 9 * * ? *)"
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
          "require('./src/lib/grants-digest').run().then(() => { process.exit(0); }).catch((err) => { console.log(err); process.exit(1); });"
        ]
        environment = [
          {
            name  = "ENABLE_DIGEST_EMAIL_CRITERIA_CRON",
            value = "true"
          },
        ]
      },
    ]
  })

  network_configuration = {
    assign_public_ip = false
    security_groups  = [module.digest_email_kickoff_cron_security_group.id]
    subnets          = var.subnet_ids
  }
}

module "digest_email_kickoff_cron_security_group" {
  source  = "cloudposse/security-group/aws"
  version = "2.2.0"

  namespace        = var.namespace
  vpc_id           = var.vpc_id
  attributes       = ["digest_email_kickoff"]
  allow_all_egress = true
}

resource "aws_service_discovery_private_dns_namespace" "default" {
  count = var.enabled ? 1 : 0

  name        = "${var.namespace}.local"
  description = "Private DNS service discovery namespace for ${var.namespace}"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "default" {
  count = var.enabled ? 1 : 0

  name = "${var.namespace}-api"

  dns_config {
    namespace_id = join("", aws_service_discovery_private_dns_namespace.default.*.id)

    dns_records {
      type = "SRV"
      ttl  = 60
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_ecs_service" "default" {
  count = var.enabled ? 1 : 0

  name                   = "${var.namespace}-api"
  cluster                = var.ecs_cluster_id
  task_definition        = join("", aws_ecs_task_definition.default.*.arn)
  desired_count          = var.default_desired_task_count
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    security_groups  = concat([module.http_security_group.id], compact(var.security_group_ids))
    subnets          = var.subnet_ids
    assign_public_ip = false
  }

  service_registries {
    registry_arn = join("", aws_service_discovery_service.default.*.arn)
    port         = local.api_container_port
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [
    aws_iam_role.execution,
    aws_iam_role_policy.execution,
  ]
}

resource "aws_appautoscaling_target" "desired_count" {
  count = var.enabled ? 1 : 0

  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${var.ecs_cluster_name}/${join("", aws_ecs_service.default.*.name)}"

  min_capacity = var.autoscaling_desired_count_minimum
  max_capacity = var.autoscaling_desired_count_maximum
}

resource "aws_appautoscaling_policy" "average_cpu_target_tracking" {
  count = var.enabled ? 1 : 0

  name               = "${var.namespace}-api-CPU-TargetTrackingScaling"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = join("", aws_appautoscaling_target.desired_count.*.service_namespace)
  resource_id        = join("", aws_appautoscaling_target.desired_count.*.resource_id)
  scalable_dimension = join("", aws_appautoscaling_target.desired_count.*.scalable_dimension)

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = 80 # percent
  }
}

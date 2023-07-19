output "ecs_cluster_name" {
  value = var.ecs_cluster_name
}

output "ecs_service_name" {
  value = aws_ecs_service.default.name
}

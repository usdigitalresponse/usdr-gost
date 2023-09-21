output "ecs_cluster_name" {
  value = var.ecs_cluster_name
}

output "ecs_service_name" {
  value = aws_ecs_service.default.name
}

output "sqs_source_queue_name" {
  value = module.sqs_queue.queue_name
}

output "sqs_dead_letter_queue_name" {
  value = module.sqs_queue.dead_letter_queue_name
}

output "ecs_cluster_name" {
  value = var.ecs_cluster_name
}

output "ecs_service_name" {
  value = aws_ecs_service.default.name
}

output "iam_execution_role_arn" {
  value = aws_iam_role.execution.arn
}

output "iam_execution_role_name" {
  value = aws_iam_role.execution.name
}

output "iam_task_role_arn" {
  value = aws_iam_role.task.arn
}

output "iam_task_role_name" {
  value = aws_iam_role.task.name
}

output "sqs_queue_url" {
  value = module.sqs_queue.queue_url
}

output "sqs_queue_arn" {
  value = module.sqs_queue.queue_arn
}

output "sqs_dlq_url" {
  value = module.sqs_queue.dead_letter_queue_url
}

output "sqs_dlq_arn" {
  value = module.sqs_queue.dead_letter_queue_arn
}

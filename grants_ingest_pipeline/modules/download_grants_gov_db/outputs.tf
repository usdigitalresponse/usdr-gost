output "lambda_function_name" {
  value = module.lambda_function.lambda_function_name
}

output "lambda_function_arn" {
  value = module.lambda_function.lambda_function_arn
}

output "lambda_function_qualified_arn" {
  value = module.lambda_function.lambda_function_qualified_arn
}

output "lambda_function_source_artifact_object_key" {
  value = module.lambda_function.s3_object.key
}

output "lambda_function_source_artifact_object_version_id" {
  value = module.lambda_function.s3_object.version_id
}

output "lambda_function_log_group_name" {
  value = module.lambda_function.lambda_cloudwatch_log_group_name
}

output "lambda_function_log_group_arn" {
  value = module.lambda_function.lambda_cloudwatch_log_group_arn
}

output "eventbridge_scheduler_schedule_arn" {
  value = join("", aws_scheduler_schedule.default.*.arn)
}

output "eventbridge_rule_arn" {
  value = join("", aws_cloudwatch_event_rule.schedule.*.arn)
}

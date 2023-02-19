output "role_arn" {
  value = join("", aws_iam_role.default.*.arn)
}

output "role_name" {
  value = join("", aws_iam_role.default.*.id)
}

output "schedule_arn" {
  value = join("", aws_scheduler_schedule.default.*.arn)
}

output "schedule_name" {
  value = join("", aws_scheduler_schedule.default.*.id)
}

output "trust_policy_json" {
  value = join("", data.aws_iam_policy_document.trust.*.json)
}

output "permissions_policy_json" {
  value = join("", data.aws_iam_policy_document.permissions.*.json)
}

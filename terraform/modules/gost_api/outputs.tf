output "base_url" {
  description = "Base URL where this deployed API service may be reached from the internet."
  value       = var.enabled ? module.api_gateway.apigatewayv2_api_api_endpoint : null
}

output "base_url_alias" {
  description = <<EOF
    Base URL where this deployed API has been aliased with a friendly domain name.
    Note that externally-managed DNS authorities may not always point this URL to the base_url;
    use base_url if you need to ensure that requests target this particular deployment.
    EOF
  value       = var.enabled ? "https://${join("", aws_route53_record.alias.*.fqdn)}" : null
}

output "ecs_cluster_name" {
  value = var.ecs_cluster_name
}

output "ecs_service_name" {
  value = join("", aws_ecs_service.default.*.name)
}

output "ecs_service_arn" {
  value = join("", aws_ecs_service.default.*.id)
}

output "ecs_task_role_name" {
  value = join("", aws_iam_role.task.*.name)
}

output "arpa_audit_reports_bucket_id" {
  value = module.arpa_audit_reports_bucket.bucket_id
}

output "arpa_audit_reports_bucket_arn" {
  value = module.arpa_audit_reports_bucket.bucket_arn
}

output "efs_data_volume_id" {
  value = module.efs_data_volume.id
}

output "efs_data_volume_access_point_id" {
  value = module.efs_data_volume.access_point_ids["data"]
}

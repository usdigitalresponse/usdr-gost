resource "aws_ssm_parameter" "deploy_cluster_name" {
  name        = "${var.ssm_deployment_parameter_path_prefix}/cluster-name"
  description = "Name of the ECS cluster to specify when forcing new deployments for the API."
  type        = "SecureString"
  key_id      = data.aws_kms_key.ssm.arn
  value       = var.ecs_cluster_name
}

resource "aws_ssm_parameter" "deploy_service_name" {
  name        = "${var.ssm_deployment_parameter_path_prefix}/service-name"
  description = "Name of the ECS service to specify when forcing new deployments for the API."
  type        = "SecureString"
  key_id      = data.aws_kms_key.ssm.arn
  value       = join("", aws_ecs_service.default.*.name)
}

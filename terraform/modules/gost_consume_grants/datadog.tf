locals {
  unified_service_tags = {
    # The var.unified_service_tags object, but with null-value items removed
    for k in compact([for k, v in var.unified_service_tags : (v != null ? k : "")]) :
    k => var.unified_service_tags[k]
  }
  datadog_env_vars = merge(
    { for k, v in local.unified_service_tags : "DD_${upper(k)}" => v },
    { for k, v in var.datadog_environment_variables : upper(k) => v },
  )
  datadog_docker_labels = {
    for k, v in local.unified_service_tags : "com.datadoghq.tags.${lower(k)}" => v
  }
}

data "aws_ssm_parameter" "datadog_api_key" {
  name = "${var.ssm_path_prefix}/datadog/api_key"
}

module "decrypt_datadog_api_key_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  name = "decrypt-datadog_api_key"

  iam_policy_statements = {
    DecryptWithKMS = {
      effect  = "Allow"
      actions = ["kms:Decrypt"]
      resources = [
        data.aws_ssm_parameter.datadog_api_key.arn,
        data.aws_kms_key.ssm.arn,
      ]
    }
    GetSecretParameters = {
      effect = "Allow"
      actions = [
        "ssm:GetParameters",
        "secretsmanager:GetSecretValue",
      ]
      resources = [data.aws_ssm_parameter.datadog_api_key.arn]
    }
  }
}

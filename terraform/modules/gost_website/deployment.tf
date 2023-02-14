locals {
  github_deployments_enabled = var.github_deployment != null
  sync_website_files_to_origin_bucket_policy_statement = {
    Effect = "Allow"
    Action = [
      "s3:DeleteObject",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
    ]
    Resource = [
      module.origin_bucket.bucket_arn,
      "${module.origin_bucket.bucket_arn}${var.origin_bucket_dist_path}/*",
    ]
  }
}

module "github_oidc" {
  source  = "../github_oidc_for_aws"
  enabled = var.enabled && var.github_deployment != null

  create_oidc_provider = false
  github_organization  = try(var.github_deployment.organization, "")
  github_repo_name     = try(var.github_deployment.repository, "")
  allow_all_branches   = try(var.github_deployment.all_branches, false)
  github_cicd_branches = try(var.github_deployment.branches, [])
  github_environments  = try(var.github_deployment.environments, [])

  tags = var.tags
}

data "aws_kms_key" "ssm" {
  key_id = "alias/aws/ssm"
}

resource "aws_ssm_parameter" "deploy_s3_uri" {
  name        = "${var.ssm_deployment_parameter_path_prefix}/s3-uri"
  description = "Base URI for deploying website dist artifacts to the origin bucket."
  type        = "SecureString"
  key_id      = data.aws_kms_key.ssm.arn
  value       = "s3://${module.origin_bucket.bucket_id}${var.origin_bucket_dist_path}/"
}

resource "aws_ssm_parameter" "deploy_cloudfront_distribution_id" {
  name        = "${var.ssm_deployment_parameter_path_prefix}/distribution-id"
  description = "Base URI for deploying website dist artifacts to the origin bucket."
  type        = "SecureString"
  key_id      = data.aws_kms_key.ssm.arn
  value       = module.cdn.cloudfront_distribution_id
}

resource "aws_iam_role" "github_deployment" {
  count = var.enabled && local.github_deployments_enabled ? 1 : 0

  name_prefix          = "${var.namespace}-github-website-deployment"
  description          = "IAM role for deploying website builds from Github."
  permissions_boundary = var.permissions_boundary_arn
  assume_role_policy   = module.github_oidc.assume_role_policy_json
  tags                 = var.tags
}

resource "aws_iam_role_policy" "github_can_read_deployment_parameters" {
  count = length(aws_iam_role.github_deployment)
  role  = aws_iam_role.github_deployment[count.index].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ]
        Resource = [
          data.aws_kms_key.ssm.arn,
          aws_ssm_parameter.deploy_s3_uri.arn,
          aws_ssm_parameter.deploy_cloudfront_distribution_id.arn,
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_can_deploy_website" {
  count = length(aws_iam_role.github_deployment)
  role  = aws_iam_role.github_deployment[count.index].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      local.sync_website_files_to_origin_bucket_policy_statement,
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = [module.cdn.cloudfront_distribution_arn]
      },
    ]
  })
}

module "website_deployment_policy" {
  source             = "cloudposse/iam-policy/aws"
  version            = "0.4.0"
  namespace          = "${var.namespace}-website-deployment"
  enabled            = var.enabled && local.github_deployments_enabled
  iam_policy_enabled = true
  description        = "Permissions for deploying GOST website build artifacts."

  iam_source_policy_documents = [module.github_to_origin_bucket_access_policy.json]
  iam_policy_statements = {
    #    UploadArtifacts = {
    #      effect    = local.sync_website_files_to_origin_bucket_policy_statement.Effect
    #      actions   = local.sync_website_files_to_origin_bucket_policy_statement.Action
    #      resources = local.sync_website_files_to_origin_bucket_policy_statement.Resource
    #    }

    InvalidateCache = {
      effect    = "Allow"
      actions   = ["cloudfront:CreateInvalidation"]
      resources = [module.cdn.cloudfront_distribution_arn]
    }

    ReadDeploymentParameters = {
      effect = "Allow"
      actions = [
        "kms:Decrypt",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
      ]
      resources = [
        data.aws_kms_key.ssm.arn,
        aws_ssm_parameter.deploy_s3_uri.arn,
        aws_ssm_parameter.deploy_cloudfront_distribution_id.arn,
      ]
    }
  }
}

module "github_to_origin_bucket_access_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"
  context = module.s3_label.context
  enabled = var.enabled && local.github_deployments_enabled

  iam_policy_statements = {
    GithubSync = {
      effect    = local.sync_website_files_to_origin_bucket_policy_statement.Effect
      actions   = local.sync_website_files_to_origin_bucket_policy_statement.Action
      resources = local.sync_website_files_to_origin_bucket_policy_statement.Resource
      principals = [{
        type        = "AWS"
        identifiers = aws_iam_role.github_deployment.*.arn
      }]
    }
  }
}

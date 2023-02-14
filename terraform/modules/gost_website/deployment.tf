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

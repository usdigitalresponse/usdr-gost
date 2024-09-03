resource "aws_cloudwatch_log_group" "default" {
  count = var.enabled ? 1 : 0

  name_prefix       = "${var.namespace}-api-"
  retention_in_days = var.log_retention
}

module "write_api_logs_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "2.0.1"
  context = module.this.context

  name = "write-logs"

  iam_policy = [
    {
      statements = [
        {
          sid    = "WriteLogs"
          effect = "Allow"
          actions = [
            "logs:CreateLogStream",
            "logs:DescribeLogStreams",
            "logs:PutLogEvents",
          ]
          resources = flatten([
            for arn in aws_cloudwatch_log_group.default[*].arn :
            [
              arn,
              "${arn}:log-stream:*"
            ]
          ])
        }
      ]
    }
  ]
}

resource "aws_cloudwatch_log_group" "default" {
  name_prefix       = "${var.namespace}-consume_grants-"
  retention_in_days = var.log_retention
}

module "write_logs_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  name = "write-logs"

  iam_policy_statements = {
    WriteLogs = {
      effect = "Allow"
      actions = [
        "logs:CreateLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
      ]
      resources = [
        aws_cloudwatch_log_group.default.arn,
        "${aws_cloudwatch_log_group.default.arn}:log-stream:*",
      ]
    }
  }
}

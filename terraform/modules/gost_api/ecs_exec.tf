module "ecs_exec_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "2.0.1"
  context = module.this.context

  iam_policy = [
    {
      statements = [
        {
          sid    = "AllowExec"
          effect = "Allow"
          actions = [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel"
          ]
          resources = ["*"]
        },
        {
          sid       = "InventoryLogGroupsForExec"
          effect    = "Allow"
          actions   = ["logs:DescribeLogGroups"]
          resources = ["*"]
        },
        {
          sid    = "WriteExecLogs"
          effect = "Allow"
          actions = [
            "logs:CreateLogStream",
            "logs:DescribeLogStreams",
            "logs:PutLogEvents",
          ]
          resources = [
            for arn in aws_cloudwatch_log_group.default[*].arn : "${arn}:log-stream:*"
          ]
        }
      ]
    }
  ]
}

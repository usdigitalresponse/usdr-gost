resource "aws_cloudwatch_event_rule" "grants_ingest-grant_modifications" {
  name        = "gost-grants_ingest-grant_modifications"
  description = "Captures grant created/updated events published by the grants-ingest service."

  event_bus_name = data.aws_cloudwatch_event_bus.grants_ingest.name
  event_pattern = jsonencode({
    source      = ["org.usdigitalresponse.grants-ingest"]
    detail-type = ["GrantModificationEvent"]
  })
}

resource "aws_cloudwatch_event_target" "sqs" {
  rule           = aws_cloudwatch_event_rule.grants_ingest-grant_modifications.name
  arn            = module.sqs_queue.queue_arn
  event_bus_name = data.aws_cloudwatch_event_bus.grants_ingest.name
}

module "sqs_queue" {
  source  = "terraform-aws-modules/sqs/aws"
  version = "4.0.1"

  name            = "${var.namespace}-grants-ingest_events"
  use_name_prefix = true

  # Primary queue
  visibility_timeout_seconds = 900 # 15 minutes
  delay_seconds              = 0
  receive_wait_time_seconds  = 20
  redrive_policy             = { maxReceiveCount = 5 } # Before sending to DLQ
  message_retention_seconds  = 172800                  # 2 days
  max_message_size           = 262144                  # 256 KiB, in bytes
  sqs_managed_sse_enabled    = true
  create_queue_policy        = true
  queue_policy_statements = {
    publish = {
      sid    = "AllowPublishFromEventBridgeRule"
      effect = "Allow"
      actions = [
        "sqs:SendMessage",
        "sqs:SendMessageBatch",
      ]
      principals = [
        {
          type        = "Service"
          identifiers = ["events.amazonaws.com"]
        },
      ]
      conditions = [{
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [aws_cloudwatch_event_rule.grants_ingest-grant_modifications.arn]
      }]
    }
  }

  # Dead-letter queue
  create_dlq                    = var.sqs_dlq_enabled
  dlq_message_retention_seconds = 604800 # 7 days
  dlq_sqs_managed_sse_enabled   = true
}

module "consume_sqs_messages_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  name = "consume-sqs-messages"

  iam_policy_statements = {
    AllowConsumeMessages = {
      effect = "Allow"
      actions = [
        "sqs:DeleteMessage",
        "sqs:ReceiveMessage",
      ]
      resources = [module.sqs_queue.queue_arn]
    }
    AllowReadMetadata = {
      effect = "Allow"
      actions = [
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl",
      ]
      resources = [module.sqs_queue.queue_arn]
    }
  }
}

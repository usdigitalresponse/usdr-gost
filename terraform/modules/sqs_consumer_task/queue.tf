module "sqs_queue" {
  source  = "terraform-aws-modules/sqs/aws"
  version = "4.0.1"

  name            = var.namespace
  use_name_prefix = true

  # Primary queue
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  delay_seconds              = var.sqs_delay_seconds
  receive_wait_time_seconds  = var.sqs_receive_wait_time_seconds
  redrive_policy             = { maxReceiveCount = var.sqs_max_receive_count } # Before sending to DLQ
  message_retention_seconds  = var.sqs_message_retention_seconds
  max_message_size           = var.sqs_max_message_size
  sqs_managed_sse_enabled    = true
  create_queue_policy        = true
  queue_policy_statements = {
    publish = {
      sid    = "AllowPublishMessages"
      effect = "Allow"
      actions = [
        "sqs:SendMessage",
        "sqs:SendMessageBatch",
      ]
      principals = [{
        type        = var.sqs_publisher.principal_type
        identifiers = [var.sqs_publisher.principal_identifier]
      }]
      conditions = var.sqs_publisher.source_arn == null ? null : [{
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [var.sqs_publisher.source_arn]
      }]
    }
  }

  # Dead-letter queue
  create_dlq                    = var.sqs_dlq_enabled
  dlq_message_retention_seconds = var.sqs_dlq_message_retention_seconds
  dlq_sqs_managed_sse_enabled   = true
}

module "consume_sqs_messages_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  name = "consume-sqs-messages"

  iam_policy = {
    statements = [
      {
        sid    = "AllowConsumeMessages"
        effect = "Allow"
        actions = [
          "sqs:DeleteMessage",
          "sqs:ReceiveMessage",
        ]
        resources = [module.sqs_queue.queue_arn]
      },
      {
        sid    = "AllowReadMetadata"
        effect = "Allow"
        actions = [
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
        ]
        resources = [module.sqs_queue.queue_arn]
      },
    ]
  }
}

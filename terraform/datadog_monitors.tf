locals {
  dd_monitor_default_evaluation_delay = 900
  datadog_draft_label                 = var.datadog_draft ? "(Draft - ${var.env})" : ""
  dd_monitor_name_prefix              = trimspace("GOST ${local.datadog_draft_label}")
  dd_monitor_default_tags = [
    "service:gost",
    "env:${var.env}",
    "team:grants",
  ]
  dd_monitor_default_notify = join(" ", [
    for v in var.datadog_monitor_notification_handles : "@${v}"
  ])
}

resource "datadog_monitor" "consume_grants-event_failed" {
  count = var.datadog_monitors_enabled ? 1 : 0

  name = "${local.dd_monitor_name_prefix}: Grant modification events failed to process"
  type = "metric alert"
  message = join("\n", [
    "{{#is_alert}}",
    "Alert: One or more grant modification events were received from the SQS source queue but failed to process after several attempts.",
    "As a result SQS messages for failed events have been redirected to the SQS dead-letter queue (DLQ).",
    "Investigate the issue (especially by checking consume_grants ECS task logs).",
    "Once the issue is resolved, send the failed event messages from the SQS DLQ back to the source queue.",
    "This monitor will not return to normal while there are messages in the DLQ.",
    "{{/is_alert}}",
    "{{#is_recovery}}",
    "Recovery: There are no longer messages in the DLQ.",
    "{{/is_recovery}}",
    "Notify: ${local.dd_monitor_default_notify}",
  ])

  query = join("", [
    "min(last_1h):avg:",
    "aws.sqs.approximate_number_of_messages_visible",
    "{env:${var.env},queuename:${module.consume_grants.sqs_dead_letter_queue_name}}",
    " > 0"
  ])

  notify_no_data   = false
  evaluation_delay = local.dd_monitor_default_evaluation_delay
  tags             = local.dd_monitor_default_tags
}

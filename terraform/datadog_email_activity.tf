resource "datadog_logs_custom_pipeline" "email_pipeline" {
  count = var.datadog_email_pipeline_enabled ? 1 : 0

  name       = "Email SES"
  is_enabled = true
  filter {
    query = "source:sns @Sns.Subject:\"Amazon SES Email Event Notification\""
  }

  // Associate trace ID
  // Note: trace_id_remapper is destructive; first duplicate mail.tags.dd_trace_id to a top-level tag
  processor {
    attribute_remapper {
      name                 = "Copy mail.tags.dd_trace_id to remapped_dd_trace_id"
      is_enabled           = true
      sources              = ["mail.tags.dd_trace_id.0"]
      source_type          = "attribute"
      target               = "remapped_dd_trace_id"
      target_type          = "attribute"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = true
    }
  }
  // Set temporary remapped_dd_trace_id as associated trace ID, which drops the source attribute
  processor {
    trace_id_remapper {
      name       = "Set Trace ID (removes remapped_dd_trace_id)"
      is_enabled = true
      sources    = ["remapped_dd_trace_id"]
    }
  }

  // Add unified service tags (sevice, env, version)
  processor {
    service_remapper {
      name       = "Define mail.tags.service as the 'service' tag of the log"
      is_enabled = true
      sources    = ["mail.tags.service.0"]
    }
  }
  processor {
    attribute_remapper {
      name                 = "Map @mail.tags.env to 'env' tag of the log"
      is_enabled           = true
      sources              = ["mail.tags.env.0"]
      source_type          = "attribute"
      target               = "env"
      target_type          = "tag"
      preserve_source      = true
      override_on_conflict = false
    }
  }
  processor {
    attribute_remapper {
      name                 = "Map mail.tags.version to 'version' tag of the log"
      is_enabled           = true
      sources              = ["mail.tags.version.0"]
      source_type          = "attribute"
      target               = "version"
      target_type          = "tag"
      preserve_source      = true
      override_on_conflict = false
    }
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_subscription" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.subscription"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Subscription service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_open" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.open"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Open service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_delivery_delay" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.delivery_delay"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:DeliveryDelay service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_rendering_failure" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.rendering_failure"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:RenderingFailure service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_click" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.click"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Click service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_reject" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.reject"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Reject service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_complaint" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.complaint"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Complaint service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_bounce" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.bounce"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Bounce service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_send" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.send"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Send service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

resource "datadog_logs_metric" "gost_ses_email_sending_event_delivery" {
  count = var.datadog_email_pipeline_metrics_enabled ? 1 : 0

  name = "gost.ses.email_sending_event.delivery"
  compute {
    aggregation_type = "count"
  }
  filter {
    query = "@Sns.Subject:\"Amazon SES Email Event Notification\" @eventType:Delivery service:gost"
  }
  group_by {
    path     = "@mail.tags.notification_type"
    tag_name = "notification-type"
  }
  group_by {
    path     = "@mail.tags.organization_id"
    tag_name = "organization-id"
  }
  group_by {
    path     = "@mail.tags.ses:configuration-set"
    tag_name = "configuration-set"
  }
  group_by {
    path     = "@mail.tags.team_id"
    tag_name = "team-id"
  }
  group_by {
    path     = "@mail.tags.user_role"
    tag_name = "user-role"
  }
}

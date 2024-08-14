resource "datadog_logs_custom_pipeline" "email_pipeline" {
  filter {
    query = "source:ses @Sns.Subject:'Amazon SES Email Event Notification'"
  }
  name       = "Email SES"
  is_enabled = true
  processor {
    service_remapper {
      sources    = ["mail.tags.service"]
      name       = "Define mail.tags.service as the 'service' tag of the log"
      is_enabled = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.env"]
      source_type          = "attribute"
      target               = "env"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map @mail.tags.env to 'env' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.notification_type"]
      source_type          = "attribute"
      target               = "notification-type"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map @mail.tags.notification_type to 'notification-type' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["eventType"]
      source_type          = "attribute"
      target               = "event-type"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map 'eventType' to 'event-type' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.user_role"]
      source_type          = "attribute"
      target               = "user-role"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map mail.tags.user_role to 'user-role' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.team_id"]
      source_type          = "attribute"
      target               = "team-id"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map mail.tags.team_id to 'team-id' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.organization_id"]
      source_type          = "attribute"
      target               = "organization-id"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map mail.tags.organization_id to 'organization-id' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.ses:configuration-set"]
      source_type          = "attribute"
      target               = "configuration-set"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map mail.tags.ses:configuration-set to 'configuration-set' tag"
      is_enabled           = true
    }
  }
  processor {
    attribute_remapper {
      sources              = ["mail.tags.version"]
      source_type          = "attribute"
      target               = "version"
      target_type          = "tag"
      target_format        = "string"
      preserve_source      = true
      override_on_conflict = false
      name                 = "Map mail.tags.version to 'version' tag"
      is_enabled           = true
    }
  }
}
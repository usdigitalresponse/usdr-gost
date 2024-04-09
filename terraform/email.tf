resource "aws_route53_record" "mail_redirect" {
  zone_id = data.aws_ssm_parameter.public_dns_zone_id.value
  name    = "mail-redirect.${data.aws_region.current.name}"
  type    = "CNAME"
  records = ["r.${data.aws_region.current.name}.awstrack.me"]
  ttl     = 86400
}

resource "aws_ses_configuration_set" "default" {
  name = "${var.namespace}-default"

  delivery_options {
    tls_policy = "Require"
  }

  tracking_options {
    custom_redirect_domain = "${aws_route53_record.mail_redirect.name}.${var.website_domain_name}"
  }
}

data "aws_sns_topic" "datadog_forwarder" {
  count = var.ses_datadog_events_enabled ? 1 : 0
  name  = "datadog-forwarder"
}

resource "aws_ses_event_destination" "default" {
  count                  = var.ses_datadog_events_enabled ? 1 : 0
  name                   = "DatadogForwarderSNSTopic"
  configuration_set_name = aws_ses_configuration_set.default.name
  enabled                = true

  sns_destination {
    topic_arn = join("", data.aws_sns_topic.datadog_forwarder[*].arn)
  }

  matching_types = [
    "send",
    "open",
    "click",
    "renderingFailure",
    "bounce",
    "complaint",
    "delivery",
    "reject",
  ]
}
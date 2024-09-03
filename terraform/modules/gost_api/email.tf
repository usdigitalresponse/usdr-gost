resource "aws_ses_email_identity" "sandbox_mode_recipients" {
  for_each = toset(sort(var.enabled ? var.ses_sandbox_mode_email_recipients : []))

  email = each.value
}

data "aws_ses_domain_identity" "notifications" {
  domain = split("@", var.notifications_email_address)[1]
}

data "aws_sesv2_configuration_set" "default" {
  configuration_set_name = var.ses_configuration_set_default
}

module "send_emails_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "2.0.1"
  context = module.this.context

  name = "send-emails"

  iam_policy = [
    {
      statements = [
        {
          sid    = "SendEmails"
          effect = "Allow"
          actions = [
            "SES:SendEmail",
            "SES:SendRawEmail",
          ]
          resources = concat(
            [
              data.aws_ses_domain_identity.notifications.arn,
              data.aws_sesv2_configuration_set.default.arn,
            ],
            values(aws_ses_email_identity.sandbox_mode_recipients)[*].arn,
          )
          conditions = [
            {
              test     = "StringLike"
              variable = "ses:FromAddress"
              values   = [var.notifications_email_address]
            }
          ]
        }
      ]
    }
  ]
}

resource "aws_ses_email_identity" "sandbox_mode_recipients" {
  for_each = toset(sort(var.enabled ? var.ses_sandbox_mode_email_recipients : []))

  email = each.value
}

data "aws_ses_domain_identity" "notifications" {
  domain = split("@", var.notifications_email_address)[1]
}

module "send_emails_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "1.0.1"
  context = module.this.context

  name = "send-emails"

  iam_policy_statements = {
    SendEmails = {
      effect = "Allow"
      actions = [
        "SES:SendEmail",
        "SES:SendRawEmail",
      ]
      resources = concat(
        [data.aws_ses_domain_identity.notifications.arn],
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
  }
}

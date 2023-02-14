resource "aws_ses_email_identity" "sandbox_mode_recipients" {
  for_each = toset(sort(var.enabled ? var.ses_sandbox_mode_email_recipients : []))

  email = each.value
}

module "send_emails_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"
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
        [var.notifications_email_domain_identity_arn],
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

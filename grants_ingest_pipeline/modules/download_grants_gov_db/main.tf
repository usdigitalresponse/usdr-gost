data "aws_caller_identity" "current" {}

locals {
  // Since EventBridge Scheduler is not yet supported by localstack, we conditionally set the below
  // lambda_trigger local value if var.eventbridge_scheduler_enabled is false.
  eventbridge_scheduler_trigger = {
    principal  = "scheduler.amazonaws.com"
    source_arn = join("", aws_scheduler_schedule.default.*.arn)
  }
  cloudwatch_events_trigger = {
    principal  = "events.amazonaws.com"
    source_arn = join("", aws_cloudwatch_event_rule.schedule.*.arn)
  }
  lambda_trigger = var.eventbridge_scheduler_enabled ? local.eventbridge_scheduler_trigger : local.cloudwatch_events_trigger
}

data "aws_s3_bucket" "grants_source_data" {
  bucket = var.grants_source_data_bucket_name
}

module "lambda_execution_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"

  iam_source_policy_documents = var.additional_lambda_execution_policy_documents
  iam_policy_statements = {
    AllowS3Upload = {
      effect  = "Allow"
      actions = ["s3:PutObject"]
      resources = [
        # Path: /sources/YYYY/mm/dd/grants.gov/archive.zip
        "${data.aws_s3_bucket.grants_source_data.arn}/sources/*/*/*/grants.gov/archive.zip"
      ]
    }
  }
}

module "lambda_function" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "${var.namespace}-DownloadGrantsGovDB"
  description   = "Downloads and stores the daily XML database extract from Grants.gov"

  role_permissions_boundary         = var.permissions_boundary_arn
  attach_cloudwatch_logs_policy     = true
  cloudwatch_logs_retention_in_days = var.log_retention_in_days
  attach_policy_json                = true
  policy_json                       = module.lambda_execution_policy.json

  handler = "bootstrap"
  runtime = "provided.al2"
  publish = true
  layers  = var.lambda_layer_arns

  source_path = [{
    path = "${var.lambda_code_path}/gosrc"
    commands = [
      "task build-download_grants_gov_db",
      "cd bin/download_grants_gov_db",
      ":zip",
    ],
  }]
  store_on_s3               = true
  s3_bucket                 = var.lambda_artifact_bucket
  s3_server_side_encryption = "AES256"

  timeout = 120 # 2 minutes, in seconds
  environment_variables = merge(var.additional_environment_variables, {
    GRANTS_GOV_BASE_URL            = "https://www.grants.gov"
    GRANTS_SOURCE_DATA_BUCKET_NAME = data.aws_s3_bucket.grants_source_data.id
    LOG_LEVEL                      = var.log_level
  })

  allowed_triggers = {
    Schedule = local.lambda_trigger
  }
}

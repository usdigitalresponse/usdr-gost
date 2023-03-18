data "aws_s3_bucket" "source_data" {
  bucket = var.grants_source_data_bucket_name
}

data "aws_s3_bucket" "prepared_data" {
  bucket = var.grants_prepared_data_bucket_name
}

module "lambda_execution_policy" {
  source  = "cloudposse/iam-policy/aws"
  version = "0.4.0"

  iam_source_policy_documents = var.additional_lambda_execution_policy_documents
  iam_policy_statements = {
    AllowS3DownloadSourceData = {
      effect  = "Allow"
      actions = ["s3:GetObject"]
      resources = [
        # Path: sources/YYYY/mm/dd/grants.gov/extract.xml
        "${data.aws_s3_bucket.source_data.arn}/sources/*/*/*/grants.gov/extract.xml"
      ]
    }
    AllowInspectS3PreparedData = {
      effect = "Allow"
      actions = [
        "s3:GetObject",
        "s3:ListBucket"
      ]
      resources = [
        data.aws_s3_bucket.prepared_data.arn,
        "${data.aws_s3_bucket.prepared_data.arn}/*/*/grants.gov/v2.xml"
      ]
    }
    AllowS3UploadPreparedData = {
      effect  = "Allow"
      actions = ["s3:PutObject"]
      resources = [
        # Path: <first 3 digits of grant ID>/<grant id>/grants.gov/v2.xml
        "${data.aws_s3_bucket.prepared_data.arn}/*/*/grants.gov/v2.xml"
      ]
    }
  }
}

resource "aws_s3_bucket_notification" "default" {
  bucket = data.aws_s3_bucket.source_data.id

  lambda_function {
    lambda_function_arn = module.lambda_function.lambda_function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "sources/"
    filter_suffix       = "/grants.gov/extract.xml"
  }
}

module "lambda_function" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "${var.namespace}-SplitGrantsGovXMLDB"
  description   = "Creates per-grant XML data files from a source Grants.gov XML DB extract."

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
      "task build-split_grants_gov_xml_db",
      "cd bin/split_grants_gov_xml_db",
      ":zip",
    ],
  }]
  store_on_s3               = true
  s3_bucket                 = var.lambda_artifact_bucket
  s3_server_side_encryption = "AES256"

  timeout = 300 # 5 minutes, in seconds
  environment_variables = merge(var.additional_environment_variables, {
    DD_TRACE_RATE_LIMIT              = "1000"
    DOWNLOAD_CHUNK_LIMIT             = "20"
    GRANTS_PREPARED_DATA_BUCKET_NAME = data.aws_s3_bucket.prepared_data.id
    GRANTS_SOURCE_DATA_BUCKET_NAME   = data.aws_s3_bucket.source_data.id
    LOG_LEVEL                        = var.log_level
    MAX_CONCURRENT_UPLOADS           = "10"
    S3_USE_PATH_STYLE                = "true"
  })
  memory_size = 1024

  allowed_triggers = {
    S3BucketNotification = {
      principal  = "s3.amazonaws.com"
      source_arn = data.aws_s3_bucket.source_data.arn
    }
  }
}

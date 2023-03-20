namespace                             = "grants-ingest"
datadog_enabled                       = false
lambda_default_log_retention_in_days  = 7
lambda_default_log_level              = "DEBUG"
eventbridge_scheduler_enabled         = false
ssm_deployment_parameters_path_prefix = "/grants-ingest/local"
additional_lambda_environment_variables = {
  S3_USE_PATH_STYLE = "true"
}

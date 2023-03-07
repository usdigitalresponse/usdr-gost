namespace = "gost-staging"

// Common
ssm_service_parameters_path_prefix    = "/gost/staging"
ssm_deployment_parameters_path_prefix = "/gost/staging/deploy-config"

// Website
website_enabled     = true
website_domain_name = "staging.grants.usdr.dev"

// ECS Cluster
cluster_container_insights_enabled = true

// API / Backend
api_enabled                    = true
api_container_image_tag        = "latest"
api_default_desired_task_count = 1
api_enable_grants_scraper      = true
api_enable_grants_digest       = false
api_log_retention_in_days      = 14

// Postgres
postgres_enabled                   = true
postgres_prevent_destroy           = true
postgres_snapshot_before_destroy   = true
postgres_apply_changes_immediately = false

namespace = "gost-sandbox"

// Common
ssm_path_prefix = "/usdr/gost/sandbox"

// Website
website_enabled     = true
website_domain_name = "sandbox.grants.usdigitalresponse.org"

// ECS Cluster
cluster_container_insights_enabled = false

// API / Backend
api_enabled                    = true
api_domain_name                = "api.sandbox.grants.usdigitalresponse.org"
api_container_image_tag        = "latest"
api_default_desired_task_count = 1
api_enable_grants_scraper      = false
api_log_retention_in_days      = 7

// Postgres
postgres_enabled                   = true
postgres_prevent_destroy           = true
postgres_snapshot_before_destroy   = false
postgres_apply_changes_immediately = true

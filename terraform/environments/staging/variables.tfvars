namespace = "gost-staging"

// Common
ssm_path_prefix = "/usdr/gost/staging"

// Website
website_enabled     = true
website_domain_name = "staging.grants.usdigitalresponse.org"

// ECS Cluster
cluster_container_insights_enabled = true

// API / Backend
api_enabled                    = true
api_domain_name                = "api.staging.grants.usdigitalresponse.org"
api_container_image_tag        = "latest"
api_default_desired_task_count = 1
api_enable_grants_scraper      = true

// Postgres
postgres_enabled                   = true
postgres_prevent_destroy           = true
postgres_snapshot_before_destroy   = true
postgres_apply_changes_immediately = false

output "rds_db_connect_resources_map" {
  description = "Map of postgres principal => corresponding resource ARN."
  value = tomap({
    for k in sort(keys(local.db_connect_resources_map)) : k => local.db_connect_resources_map[k]
  })
}

output "rds_db_connect_resources_list" {
  description = "Like rds_db_connect_resources_map but without keys (can be used for IAM policy resources array)."
  value       = sort(values(local.db_connect_resources_map))
}

output "master_username" {
  description = "Cluster master username."
  value       = module.db.cluster_master_username
}

output "master_password" {
  description = "Cluster master password."
  value       = random_password.postgres_user.result
  sensitive   = true
}

output "cluster_endpoint" {
  description = "Endpoint on which allowed ingress sources may to connect to the cluster."
  value       = module.db.cluster_endpoint
}

output "cluster_port" {
  description = "Port on which allowed ingress sources may to connect to the cluster."
  value       = module.db.cluster_port
}

output "default_db_name" {
  description = "Name of the database that was automatically created with the cluster."
  value       = module.db.cluster_database_name
}

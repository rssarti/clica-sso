# App Platform Outputs
output "app_url" {
  description = "URL of the deployed application"
  value       = "https://${digitalocean_app.clica_sso_app.default_ingress}"
}

output "app_id" {
  description = "Digital Ocean App Platform App ID"
  value       = digitalocean_app.clica_sso_app.id
}

# Database Outputs
output "database_host" {
  description = "Database private host"
  value       = digitalocean_database_cluster.clica_sso_db.private_host
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = digitalocean_database_cluster.clica_sso_db.port
}

output "database_name" {
  description = "Database name"
  value       = digitalocean_database_db.clica_sso_database.name
}

output "database_user" {
  description = "Database username"
  value       = digitalocean_database_user.clica_sso_user.name
}

output "database_password" {
  description = "Database password"
  value       = digitalocean_database_user.clica_sso_user.password
  sensitive   = true
}

output "database_connection_string" {
  description = "Database connection string"
  value       = digitalocean_database_cluster.clica_sso_db.private_uri
  sensitive   = true
}

# Spaces Outputs
output "spaces_bucket_name" {
  description = "Spaces bucket name"
  value       = digitalocean_spaces_bucket.clica_sso_storage.name
}

output "spaces_endpoint" {
  description = "Spaces endpoint URL"
  value       = "https://${digitalocean_spaces_bucket.clica_sso_storage.bucket_domain_name}"
}

output "spaces_region" {
  description = "Spaces region"
  value       = digitalocean_spaces_bucket.clica_sso_storage.region
}

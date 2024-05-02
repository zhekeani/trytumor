output "secret_data" {
  value       = local.secret_data
  sensitive   = true
  description = "Fetched secret data"
}

output "secret_name" {
  value       = local.secret_name
  sensitive   = false
  description = "Secret name."
}


output "secret_path" {
  value       = "projects/${data.google_project.current.project_id}/secrets/${local.secret_name}/versions/latest"
  sensitive   = true
  description = "Secret version latest path."
}

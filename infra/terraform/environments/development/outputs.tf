output "service_accounts_key" {
  value       = module.service_account.sa_private_keys
  sensitive   = true
  description = "All service accounts key that created in development environment."
  depends_on  = [module.service_account]
}

output "secrets_path" {
  value       = local.secrets_path
  sensitive   = false
  description = "All secret path that stored in secret manager"
  depends_on  = [data.google_secret_manager_secrets.all]
}

output "ar_repositories_url" {
  value       = module.artifact_registry.repositories_url
  sensitive   = false
  description = "Artifact Registry repositories URL."
  depends_on  = [module.artifact_registry]
}

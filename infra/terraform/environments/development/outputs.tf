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

output "jwt_config_secrets_name" {
  value = {
    for secret in keys(module.jwt_config_secrets) :
    secret => module.jwt_config_secrets[secret].secret_name
  }
  sensitive   = true
  description = "JWT config secrets name that stored in the Secret Manager."
  depends_on  = [module.jwt_config_secrets]
}


output "ar_repositories_url" {
  value       = module.artifact_registry.repositories_url
  sensitive   = false
  description = "Artifact Registry repositories URL."
  depends_on  = [module.artifact_registry]
}

output "storage_bucket_name" {
  value       = module.storage_bucket.bucket_name
  sensitive   = false
  description = "Created storage bucket name."
  depends_on  = [module.storage_bucket]
}

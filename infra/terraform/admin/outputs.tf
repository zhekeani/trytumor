output "created_custom_roles" {
  value       = module.custom_role.created_roles
  sensitive   = false
  description = "Custom role name and ID."
  depends_on  = [module.custom_role]
}

output "service_accounts" {
  value       = module.service_account.all
  sensitive   = false
  description = "Created service accounts."
  depends_on  = [module.service_account]
}

output "tf_workspace_wif" {
  value       = module.tf_workspaces.wif
  sensitive   = false
  description = "Workload identity pool provider name and service account email used by Terraform workspaces to authenticate with GCP via Workload Identity Federation."
  depends_on  = [module.tf_workspaces]
}

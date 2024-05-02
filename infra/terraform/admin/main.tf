data "google_project" "current" {}

locals {
  tf_org_name  = "zhekeani-first-org"
  project_name = "trytumor"
}

module "service_account" {
  source       = "./modules/utils/gcp/service-account"
  project_name = local.project_name
}

output "service_accounts" {
  value       = module.service_account.all
  sensitive   = false
  description = "Created service accounts."
  depends_on  = [module.service_account]
}

module "custom_role" {
  source = "./modules/utils/gcp/iam/custom_role"
}

output "tf_custom_role" {
  value       = module.custom_role.tf_workspace
  sensitive   = false
  description = "Custom role for Terraform cloud workspace."
  depends_on  = [module.custom_role]
}

module "tf_workspaces" {
  source       = "./modules/environments/terraform-workspaces"
  tf_org_name  = local.tf_org_name
  project_name = local.project_name
  tf_service_accounts = {
    tf_development = module.service_account.all["tf_development"]
  }
}

output "tf_workspace_wif" {
  value       = module.tf_workspaces.wif
  sensitive   = false
  description = "Workload identity pool provider name and service account email used by Terraform workspaces to authenticate with GCP via Workload Identity Federation."
  depends_on  = [module.tf_workspaces]
}

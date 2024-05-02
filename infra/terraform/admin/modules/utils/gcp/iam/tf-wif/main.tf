data "google_project" "current" {}

# Enable APIs
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "~> 14.5"

  project_id                  = data.google_project.current.project_id
  enable_apis                 = true
  disable_services_on_destroy = false

  activate_apis = [
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com"
  ]
}

locals {
  suffix           = var.environment.prefix
  wip_id           = "tf-pool-${local.suffix}-v0-0-1"
  wip_display_name = "tf-pool-${local.suffix}"
  wip_description  = "Terraform ${data.google_project.current.project_id} ${var.environment.type} pool."
}

resource "google_iam_workload_identity_pool" "tf_identity_pool" {
  workload_identity_pool_id = local.wip_id
  display_name              = local.wip_display_name
  description               = local.wip_description
  disabled                  = false
}

locals {
  created_wip_id           = google_iam_workload_identity_pool.tf_identity_pool.workload_identity_pool_id
  wip_provider_id          = "tfc-oidc-${local.suffix}"
  wip_provider_description = "Terraform Cloud OIDC provider."
}


resource "google_iam_workload_identity_pool_provider" "pool-provider" {
  workload_identity_pool_id          = local.created_wip_id
  workload_identity_pool_provider_id = local.wip_provider_id
  description                        = local.wip_provider_description
  disabled                           = false

  attribute_mapping = {
    "attribute.tfc_organization_id"   = "assertion.terraform_organization_id"
    "attribute.tfc_organization_name" = "assertion.terraform_organization_name"
    "attribute.tfc_project_id"        = "assertion.terraform_project_id"
    "attribute.tfc_project_name"      = "assertion.terraform_project_name"
    "google.subject"                  = "assertion.terraform_workspace_id"
    "attribute.tfc_workspace_name"    = "assertion.terraform_workspace_name"
    "attribute.tfc_workspace_env"     = "assertion.terraform_workspace_name.split('-')[assertion.terraform_workspace_name.split('-').size() -1]"
  }

  oidc {
    issuer_uri = "https://app.terraform.io"
  }

  attribute_condition = "attribute.tfc_organization_name ==\"${var.tf_org_name}\" && attribute.tfc_workspace_env.startsWith ('${local.suffix}')"
}


resource "google_service_account_iam_binding" "sa_tf_trytumor_iam" {
  service_account_id = var.sa_name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "principal://iam.googleapis.com/projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/${local.created_wip_id}/subject/${var.workspace_id}",
  ]
}

output "wip_provider_name" {
  value = "projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/${local.created_wip_id}/providers/${google_iam_workload_identity_pool_provider.pool-provider.workload_identity_pool_provider_id}"
}

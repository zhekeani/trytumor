data "google_project" "current" {}

variable "project_name" {
  type        = string
  description = "Project name."
}

locals {
  sa_id_template           = "sa-tf-%s-%s"
  sa_display_name_template = "Service Account - Terraform %s-%s workspace."
}

locals {
  service_accounts = {
    tf_development = {
      sa_name         = "tf_development"
      sa_id           = format(local.sa_id_template, var.project_name, "dev")
      sa_display_name = format(local.sa_display_name_template, var.project_name, "development")
    }
  }
}

# Create service account for each Terraform workspace
resource "google_service_account" "tf_workspaces" {
  for_each = local.service_accounts

  account_id   = each.value.sa_id
  display_name = each.value.sa_display_name
}

output "all" {
  value = {
    for service_account, sa_obj in local.service_accounts :
    service_account => {
      email = google_service_account.tf_workspaces["${sa_obj.sa_name}"].email
      name  = google_service_account.tf_workspaces["${sa_obj.sa_name}"].name
    }
  }
  sensitive   = false
  description = "Service accounts for each Terraform cloud workspaces."
  depends_on  = [google_service_account.tf_workspaces]
}

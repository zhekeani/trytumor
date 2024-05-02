data "google_project" "current" {}

# Enable the used APIs
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "~> 14.5"

  project_id                  = data.google_project.current.project_id
  enable_apis                 = true
  disable_services_on_destroy = false

  activate_apis = [
    "secretmanager.googleapis.com",
    "iam.googleapis.com"
  ]
}

locals {
  sa_id_template = "${var.environment.prefix}-sa-%s"
  sa_display_name_template = "Service Account - ${var.environment.type} %s"
}


locals {
  service_accounts = {
    secret_accessor = {
      account_id   = format(local.sa_id_template, "secret-accessor")
      display_name = format(local.sa_display_name_template, "secret accessor")
    }
    object_admin = {
      account_id   = format(local.sa_id_template, "object-admin")
      display_name = format(local.sa_display_name_template, "storage object admin.")
    }
    # kubernetes_engine = {
    #   account_id   = "${var.environment.prefix}-kubernetes-engine"
    #   display_name = "Service Account - ${var.environment.type} Kubernetes Engine."
    # }
    artifact_registry_reader = {
      account_id   = format(local.sa_id_template, "ar-reader")
      display_name = format(local.sa_display_name_template, "Artifact Registry Reader.")
    }
  }
}

# Create service account for reading or pulling artifacts in artifact registry
resource "google_service_account" "trytumor" {
  for_each = local.service_accounts

  account_id   = each.value.account_id
  display_name = each.value.display_name

  depends_on = [module.project-services]
}

# Generate service account key
resource "google_service_account_key" "trytumor" {
  for_each = google_service_account.trytumor

  service_account_id = each.value.name

  depends_on = [google_service_account.trytumor]
}

module "ar_reader_project_iam_bindings" {
  source  = "terraform-google-modules/iam/google//modules/projects_iam"
  version = "~> 7.7"

  projects = [data.google_project.current.project_id]

  bindings = {
    "roles/artifactregistry.reader" = [
      "serviceAccount:${google_service_account.trytumor["artifact_registry_reader"].email}",
    ]

    "roles/secretmanager.secretAccessor" = [
      "serviceAccount:${google_service_account.trytumor["secret_accessor"].email}"
    ]

    "roles/storage.objectAdmin" = [
      "serviceAccount:${google_service_account.trytumor["object_admin"].email}"
    ]
  }
}
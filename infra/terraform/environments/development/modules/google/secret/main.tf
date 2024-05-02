# Get the current project data
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
  ]
}

# Set the environment prefix
locals {
  prefix = var.environment.prefix

  secret_name = "${local.prefix}-${var.secret_type}"
}

# Fetch remote secret
data "google_secret_manager_secret_version" "remote_secret" {
  count = var.secret_source == 0 ? 1 : 0

  secret = local.secret_name
}

# Set the secret data based on the "secret_source" value
locals {
  remote_secret_data   = var.secret_source == 0 ? data.google_secret_manager_secret_version.remote_secret[0].secret_data : null
  provided_secret_data = var.secret_source == 1 ? var.provided_secret_data : null

  secret_data = coalesce(local.remote_secret_data, local.provided_secret_data)
}

# Save the secret data to secret manager
module "secret-manager" {
  source     = "GoogleCloudPlatform/secret-manager/google"
  version    = "~> 0.2"
  project_id = data.google_project.current.project_id

  secrets = [
    {
      name                  = local.secret_name
      automatic_replication = true
      secret_data           = local.secret_data
    }
  ]

  depends_on = [module.project-services]
}




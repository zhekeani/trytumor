data "google_project" "current" {}


# Enable the used APIs
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "~> 14.5"

  project_id                  = data.google_project.current.project_id
  enable_apis                 = true
  disable_services_on_destroy = false

  activate_apis = [
    "storage.googleapis.com"
  ]
}

locals {
  bucket_name = "${var.environment.prefix}-${var.bucket_name}-bucket"
}


# Create storage bucket
resource "google_storage_bucket" "public_media_bucket" {
  name                        = local.bucket_name
  location                    = var.location
  force_destroy               = true
  project                     = data.google_project.current.project_id
  uniform_bucket_level_access = false

  labels = {
    environment = var.environment.type
    app         = "backend"
    security    = "public"
    region      = var.location
  }

  depends_on = [module.project-services]
}

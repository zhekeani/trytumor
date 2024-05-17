# Enable the used APIs
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "~> 14.5"

  project_id                  = var.project_id
  enable_apis                 = true
  disable_services_on_destroy = false

  activate_apis = [
    "iam.googleapis.com",
  ]
}

module "ar_reader_project_iam_bindings" {
  source  = "terraform-google-modules/iam/google//modules/projects_iam"
  version = "~> 7.7"
  mode    = "additive"

  projects = [var.project_id]


  bindings = {
    "roles/artifactregistry.reader" = [
      "serviceAccount:${var.sa_emails.artifact_registry_reader}",
    ]

    "roles/secretmanager.secretAccessor" = [
      "serviceAccount:${var.sa_emails.secret_accessor}"
    ]

    "roles/pubsub.admin" = [
      "serviceAccount:${var.sa_emails.pubsub_admin}"
    ]
  }

  depends_on = [module.project-services]
}

module "storage_buckets_iam_bindings" {
  source          = "terraform-google-modules/iam/google//modules/storage_buckets_iam"
  mode            = "additive"
  storage_buckets = var.storage_buckets

  bindings = {
    "projects/trytumor/roles/storageGetObjectAdmin" = [
      "serviceAccount:${var.sa_emails.object_admin}"
    ]
  }
}
data "google_project" "current" {}

module "ar_reader_project_iam_bindings" {
  source  = "terraform-google-modules/iam/google//modules/projects_iam"
  version = "~> 7.7"

  projects = [data.google_project.current.project_id]

  bindings = {
    "roles/artifactregistry.reader" = [
      "serviceAccount:${var.sa_emails.artifact_registry_reader}",
    ]

    "roles/secretmanager.secretAccessor" = [
      "serviceAccount:${var.sa_emails.secret_accessor}"
    ]
  }
}

module "storage_buckets_iam_bindings" {
  source  = "terraform-google-modules/iam/google//modules/storage_buckets_iam"
  mode            = "additive"
  storage_buckets = var.storage_buckets

  bindings = {
    "projects/trytumor/roles/storageGetObjectAdmin" = [
      "serviceAccount:${var.sa_emails.object_admin}"
    ]
  }
}
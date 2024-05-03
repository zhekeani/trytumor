data "google_project" "current" {}

locals {
  environment = {
    type   = "development"
    prefix = "dev"
  }
  region              = "asia-southeast2"
  storage_bucket_name = "zhekeani-${data.google_project.current.project_id}"
}

# Create service account and generate service account key
module "service_account" {
  source      = "./modules/google/service-account"
  location    = local.region
  environment = local.environment
}

locals {
  service_accounts_email = {
    for service_account, sa_obj in module.service_account.sa_obj :
    service_account => sa_obj.email
  }
}

module "service_account_iam" {
  source    = "./modules/google/service-account/iam"
  sa_emails = local.service_accounts_email
  storage_buckets = [module.storage_bucket.bucket_name]

  depends_on = [module.service_account, module.storage_bucket]
}


# Store service account key to Secret Manager
module "sa_key_secrets" {
  for_each = module.service_account.sa_private_keys

  source               = "./modules/google/secret"
  secret_source        = 1
  provided_secret_data = each.value
  secret_type          = "${replace(each.key, "_", "-")}-sa-key"
  environment          = local.environment
}

data "google_secret_manager_secrets" "all" {
}

locals {
  secrets_path = [for secret in data.google_secret_manager_secrets.all.secrets : secret.name]
}
# Create Artifact Registry repositories
module "artifact_registry" {
  source            = "./modules/google/artifact-registry"
  location          = local.region
  environment       = local.environment
  repositories_name = ["auth"]
}


# Create storage bucket
module "storage_bucket" {
  source      = "./modules/google/storage-bucket"
  location    = local.region
  environment = local.environment
  bucket_name = local.storage_bucket_name
}

output "storage_bucket_name" {
  value       = module.storage_bucket.bucket_name
  sensitive   = false
  description = "Created storage bucket name."
  depends_on  = [module.storage_bucket]
}

data "google_project" "current" {}

locals {
  environment = {
    type   = "development"
    prefix = "dev"
  }
  region              = "asia-southeast2"
  project_name        = data.google_project.current.name
  storage_bucket_name = "zhekeani-${data.google_project.current.project_id}"
}


# ----------------------------------------------------------------------------------- #
# Service Account
module "service_account" {
  source      = "./modules/google/service-account"
  location    = local.region
  environment = local.environment
  project_id  = data.google_project.current.project_id
}

locals {
  service_accounts_email = {
    for service_account, sa_obj in module.service_account.sa_obj :
    service_account => sa_obj.email
  }
}

module "service_account_iam" {
  source          = "./modules/google/service-account/iam"
  project_id      = data.google_project.current.project_id
  sa_emails       = local.service_accounts_email
  storage_buckets = [module.storage_bucket.bucket_name]

  depends_on = [module.service_account, module.storage_bucket]
}


# ----------------------------------------------------------------------------------- #
# Secret Manager

module "sa_key_secrets" {
  for_each = module.service_account.sa_private_keys

  source               = "./modules/google/secret"
  secret_source        = 1
  provided_secret_data = each.value
  secret_type          = "${replace(each.key, "_", "-")}-sa-key"
  environment          = local.environment
}


locals {
  jwt_config = {
    jwt_secret = {
      provided_secret_data = var.jwt_secret
      secret_type          = "config-jwt-secret"
    }
    jwt_refresh_secret = {
      provided_secret_data = var.jwt_refresh_secret
      secret_type          = "config-jwt-refresh-secret"
    }
    jwt_testing_secret = {
      provided_secret_data = var.jwt_testing_secret
      secret_type          = "config-jwt-testing-secret"
    }
    jwt_expiration = {
      provided_secret_data = var.jwt_expiration
      secret_type          = "config-jwt-expiration"
    }
    jwt_refresh_expiration = {
      provided_secret_data = var.jwt_refresh_expiration
      secret_type          = "config-jwt-refresh-expiration"
    }
  }
}

module "jwt_config_secrets" {
  for_each = local.jwt_config

  source               = "./modules/google/secret"
  secret_source        = 1
  provided_secret_data = each.value.provided_secret_data
  secret_type          = each.value.secret_type
  environment          = local.environment
}


# ----------------------------------------------------------------------------------- #
# Storage Bucket


# Create storage bucket
module "storage_bucket" {
  source      = "./modules/google/storage-bucket"
  location    = local.region
  environment = local.environment
  bucket_name = local.storage_bucket_name
}


# ----------------------------------------------------------------------------------- #
# Artifact Registry


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



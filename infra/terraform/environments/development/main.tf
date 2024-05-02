data "google_project" "current" {}

locals {
  environment = {
    type   = "development"
    prefix = "dev"
  }
  region = "asia-southeast2"
}

# Create service account and generate service account key
module service_account {
  source = "./modules/google/service-account"
  location = local.region
  environment = local.environment
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
module artifact_registry {
  source = "./modules/google/artifact-registry"
  location = local.region
  environment = local.environment
  repositories_name = ["auth"]
}

output "ar_repositories_url" {
  value       = module.artifact_registry.repositories_url
  sensitive   = false
  description = "Artifact Registry repositories URL."
  depends_on  = [module.artifact_registry]
}

data "google_project" "current" {}

locals {
  environment = {
    type   = "development"
    prefix = "dev"
  }
  region = "asia-southeast2"
}

module service_account {
  source = "./modules/google/service-account"
  location = local.region
  environment = local.environment
}

output service_accounts_key {
  value       = module.service_account.sa_private_keys
  sensitive   = true
  description = "All service accounts key that created in development environment."
  depends_on  = [module.service_account]
}


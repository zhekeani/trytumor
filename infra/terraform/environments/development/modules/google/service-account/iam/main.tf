data "google_project" "current" {}

# Create service account for reading or pulling artifacts in artifact registry
resource "google_service_account" "artifact_registry_reader" {
  account_id   = "${var.environment.prefix}-artifact-registry-reader"
  display_name = "Service Account - ${var.environment.type} artifact registry reader"
}

# Generate service account key
resource "google_service_account_key" "artifact_registry_reader" {
  service_account_id = google_service_account.artifact_registry_reader.name
}
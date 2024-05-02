data "google_project" "current" {}

resource "google_project_iam_custom_role" "tf_workspace" {
  project     = data.google_project.current.project_id
  role_id     = "tfWorkspaceProjectRole"
  title       = "Terraform cloud workspace role"
  description = "Terraform cloud workspace role."
  permissions = [
    "resourcemanager.projects.getIamPolicy",
    "resourcemanager.projects.setIamPolicy",
    "storage.buckets.getIamPolicy",
    "storage.buckets.setIamPolicy",
    "secretmanager.secrets.getIamPolicy",
    "secretmanager.secrets.setIamPolicy",
    "compute.subnetworks.getIamPolicy",
    "compute.subnetworks.setIamPolicy"
  ]
}

output "tf_workspace" {
  value = {
    id   = google_project_iam_custom_role.tf_workspace.id
    name = google_project_iam_custom_role.tf_workspace.name
  }
  sensitive   = false
  description = "Custom role for Terraform cloud workspace."
  depends_on  = [google_project_iam_custom_role.tf_workspace]
}

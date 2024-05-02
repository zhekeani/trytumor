variable "project_id" {
  type        = string
  description = "GCP project ID."
}

variable "sa_email" {
  type        = string
  description = "Service account email."
}

variable "roles" {
  type        = list(string)
  description = "Roles to assign to service account."
}

resource "google_project_iam_binding" "multiple_roles" {
  for_each = toset(var.roles)

  project = var.project_id
  members = ["serviceAccount:${var.sa_email}"]
  role    = each.value
}

# module "project-iam-bindings" {
#   source   = "terraform-google-modules/iam/google//modules/projects_iam"
#   projects = [var.project_id]
#   mode     = "additive"

#   for_each = toset(var.roles)

#   bindings = {
#     "${each.value}" = [
#       "serviceAccount:${var.sa_email}",
#     ]
#   }
# }
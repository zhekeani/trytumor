
output "repositories_url" {
  value = {
    for repository_name in local.repositories_name :
    repository_name => "${var.location}-docker.pkg.dev/${data.google_project.current.project_id}/${var.environment.prefix}-${data.google_project.current.name}-${repository_name}"
  }
  sensitive   = true
  description = "NestJS micro-services Artifact Registry repositories URL."
}

output "repositories_name" {
  value = {
    for repository_name in local.repositories_name :
    repository_name => {
      repository_name = "${var.environment.prefix}-${data.google_project.current.name}-${repository_name}"
    }
  }
  sensitive   = false
  description = "Artifact Registry repositories name."
  depends_on  = [google_artifact_registry_repository.repo]
}

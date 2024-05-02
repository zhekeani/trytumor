variable "tf_org_name" {
  type        = string
  description = "Terraform organization name."
}

variable "project_name" {
  type        = string
  description = "Project name."
}

variable "tf_service_accounts" {
  type = object({
    tf_development = object({
      email = string
      name  = string
    })
  })
  description = "Service account to be used by Terraform workspaces."
}
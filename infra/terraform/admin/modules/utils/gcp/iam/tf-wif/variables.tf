variable "tf_org_name" {
  type        = string
  description = "Terraform organization name."
}

variable "sa_name" {
  type        = string
  description = "Service account name that will impersonated by workload identity pool."
}

variable "environment" {
  type = object({
    prefix = string
    type   = string
  })
  description = "Terraform workspace cloud environment."
}

variable "workspace_id" {
  type        = string
  description = "Terraform cloud workspace ID."
}




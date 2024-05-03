variable "sa_emails" {
  type = object({
    secret_accessor          = string
    object_admin             = string
    artifact_registry_reader = string
  })
  description = "Service accounts email to be assigned specific roles."
}

variable storage_buckets {
  type        = list(string)
  description = "List of storage bucket to be accessed by service account."
}

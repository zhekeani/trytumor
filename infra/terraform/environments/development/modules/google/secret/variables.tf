variable "secret_source" {
  type        = number
  default     = 0
  description = "Whether to fetch secret data from, Google Secret Manager (0), manually provided (1)"
}

variable "provided_secret_data" {
  type        = string
  default     = ""
  description = "Secret data that provided manually"
}

variable "secret_type" {
  type        = string
  description = "Secret type to fetch: 'jwt'; 'database'"
}

variable "environment" {
  type = object({
    prefix = string
    type   = string
  })
  description = "Cloud environment where the secret is used: 'development'; 'test'; 'production'"
}
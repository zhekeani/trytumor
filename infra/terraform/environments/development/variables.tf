variable "jwt_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Placeholder for JWT secret value."
}

variable "jwt_refresh_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Placeholder for JWT refresh secret value."
}

variable "jwt_testing_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Placeholder for JWT testing secret value."
}

variable "jwt_expiration" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Placeholder for JWT secret expiration value."
}

variable "jwt_refresh_expiration" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Placeholder for JWT refresh secret expiration value."
}



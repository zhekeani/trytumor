variable "location" {
  type        = string
  description = "Location this storage bucket is located in."
}

variable "environment" {
  type = object({
    type   = string
    prefix = string
  })
  description = "Cloud environment config."
}

variable "bucket_name" {
  type        = string
  description = "The name of the storage bucket."
}
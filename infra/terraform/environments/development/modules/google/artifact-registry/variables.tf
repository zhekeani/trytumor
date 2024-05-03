variable "environment" {
  type = object({
    type   = string
    prefix = string
  })
  description = "Cloud environment config."
}

variable "location" {
  type        = string
  description = "The location this repository is located in."
}

variable "repositories_name" {
  type        = list(string)
  description = "List of repositories name."
}

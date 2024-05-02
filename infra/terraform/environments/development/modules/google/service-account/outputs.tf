output "sa_private_keys" {
  value = {
    for service_account_name, service_account in google_service_account_key.trytumor :
    service_account_name => service_account.private_key
  }
  sensitive   = true
  description = "All service accounts key."
  depends_on  = [google_service_account_key.trytumor]
}


output "sa_obj" {
  value = {
    for service_account_name, service_account in google_service_account.trytumor :
    service_account_name => service_account
  }
  sensitive   = false
  description = "All service accounts properties."
  depends_on  = [google_service_account.trytumor]
}

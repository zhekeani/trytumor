output "bucket_name" {
  value       = google_storage_bucket.public_media_bucket.name
  sensitive   = false
  description = "Storage public media bucket name."
}

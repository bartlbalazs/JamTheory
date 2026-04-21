# ---------------------------------------------------------------------------
# Outputs — consumed by deploy.sh to generate environment.prod.ts
# and for operator reference.
# ---------------------------------------------------------------------------

output "api_gateway_url" {
  description = "Public HTTPS base URL of the API Gateway. Used in environment.prod.ts."
  value       = "https://${google_api_gateway_gateway.jamtheory.default_hostname}"
}

output "generate_masterclass_function_url" {
  description = "Direct Cloud Run URL of generate-masterclass (internal — do not expose publicly)."
  value       = google_cloudfunctions2_function.generate_masterclass.service_config[0].uri
}

output "regenerate_licks_function_url" {
  description = "Direct Cloud Run URL of regenerate-licks (internal — do not expose publicly)."
  value       = google_cloudfunctions2_function.regenerate_licks.service_config[0].uri
}

output "hosting_default_url" {
  description = "Default Firebase Hosting URL."
  value       = "https://${google_firebase_hosting_site.jamtheory.site_id}.web.app"
}

output "firebase_web_app_id" {
  description = "Firebase Web App ID (used to retrieve SDK config)."
  value       = google_firebase_web_app.jamtheory.app_id
}

output "firebase_api_key" {
  description = "Firebase Web API key (safe to expose — restricted by Firebase security rules)."
  value       = data.google_firebase_web_app_config.jamtheory.api_key
  sensitive   = true
}

output "firebase_messaging_sender_id" {
  description = "Firebase Messaging Sender ID."
  value       = data.google_firebase_web_app_config.jamtheory.messaging_sender_id
}

output "firebase_storage_bucket" {
  description = "Default Firebase Storage bucket (derived — not used in iteration 1)."
  value       = "${var.project_id}.appspot.com"
}

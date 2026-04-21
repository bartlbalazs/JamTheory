variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Functions, API Gateway, and GCS buckets."
  type        = string
  default     = "europe-west1"
}

variable "db_name" {
  description = "Firestore database name. Use '(default)' for the default database."
  type        = string
  default     = "(default)"
}

variable "firebase_app_display_name" {
  description = "Display name for the Firebase web app resource."
  type        = string
  default     = "JamTheory"
}

# ---------------------------------------------------------------------------
# Cloud Function sizing
# ---------------------------------------------------------------------------

variable "generate_masterclass_memory" {
  description = "Memory for the generate-masterclass Cloud Function."
  type        = string
  default     = "512M"
}

variable "generate_masterclass_cpu" {
  description = "vCPU for generate-masterclass. Must be '1' when memory > 512Mi."
  type        = string
  default     = "0.333"
}

variable "generate_masterclass_timeout" {
  description = "Timeout (seconds) for generate-masterclass."
  type        = number
  default     = 180
}

variable "regenerate_licks_memory" {
  description = "Memory for the regenerate-licks Cloud Function."
  type        = string
  default     = "512M"
}

variable "regenerate_licks_cpu" {
  description = "vCPU for regenerate-licks."
  type        = string
  default     = "0.333"
}

variable "regenerate_licks_timeout" {
  description = "Timeout (seconds) for regenerate-licks."
  type        = number
  default     = 120
}

# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------

variable "youtube_api_key" {
  description = "YouTube Data API v3 key. Stored in Secret Manager and injected into the Cloud Functions at runtime."
  type        = string
  sensitive   = true
}

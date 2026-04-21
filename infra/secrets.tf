# ---------------------------------------------------------------------------
# Secret Manager — stores the YouTube Data API v3 key.
#
# The secret value comes from var.youtube_api_key (supplied via
# terraform.tfvars, which is git-ignored). The Cloud Functions receive it
# as the env var YOUTUBE_API_KEY (see functions.tf secret_environment_variables).
# ---------------------------------------------------------------------------

resource "google_secret_manager_secret" "youtube_api_key" {
  project   = var.project_id
  secret_id = "youtube-api-key"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "youtube_api_key" {
  secret      = google_secret_manager_secret.youtube_api_key.id
  secret_data = var.youtube_api_key
}

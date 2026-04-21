# ---------------------------------------------------------------------------
# Cloud Functions (2nd gen) — generate-masterclass and regenerate-licks.
#
# Source zip is built by deploy.sh (--infra) and placed at:
#   infra/.build/backend.zip
#
# Both functions are deployed with --no-allow-unauthenticated (org policy).
# Only the API Gateway SA holds roles/run.invoker on them.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Private GCS bucket for Cloud Function source archives.
# ---------------------------------------------------------------------------

resource "google_storage_bucket" "cf_source" {
  name          = "${var.project_id}-jamtheory-cf-source"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket_object" "backend_zip" {
  name   = "backend-${filemd5("${path.module}/.build/backend.zip")}.zip"
  bucket = google_storage_bucket.cf_source.name
  source = "${path.module}/.build/backend.zip"
}

# ---------------------------------------------------------------------------
# generate-masterclass
# ---------------------------------------------------------------------------

resource "google_cloudfunctions2_function" "generate_masterclass" {
  project     = var.project_id
  location    = var.region
  name        = "generate-masterclass"
  description = "Fetches YouTube metadata and produces a structured masterclass via Gemini."

  build_config {
    runtime     = "python311"
    entry_point = "generate_masterclass_fn"

    environment_variables = {
      GOOGLE_FUNCTION_SOURCE = "fn_generate_masterclass.py"
    }

    source {
      storage_source {
        bucket = google_storage_bucket.cf_source.name
        object = google_storage_bucket_object.backend_zip.name
      }
    }
  }

  service_config {
    available_memory               = var.generate_masterclass_memory
    available_cpu                  = var.generate_masterclass_cpu
    timeout_seconds                = var.generate_masterclass_timeout
    max_instance_count             = 2
    min_instance_count             = 0
    all_traffic_on_latest_revision = true

    service_account_email = google_service_account.cf_runtime_sa.email

    environment_variables = {
      GOOGLE_CLOUD_PROJECT = var.project_id
      FIRESTORE_DB         = var.db_name
      GCP_REGION           = var.region
    }

    secret_environment_variables {
      key        = "YOUTUBE_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.youtube_api_key.secret_id
      version    = "latest"
    }
  }

  depends_on = [
    google_project_service.apis,
    google_storage_bucket_object.backend_zip,
    google_secret_manager_secret_version.youtube_api_key,
  ]
}

resource "google_cloud_run_service_iam_member" "generate_masterclass_invoker" {
  project  = var.project_id
  location = var.region
  service  = google_cloudfunctions2_function.generate_masterclass.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api_gateway_sa.email}"
}

# ---------------------------------------------------------------------------
# regenerate-licks
# ---------------------------------------------------------------------------

resource "google_cloudfunctions2_function" "regenerate_licks" {
  project     = var.project_id
  location    = var.region
  name        = "regenerate-licks"
  description = "Regenerates the 3 vocabulary licks for an existing track variant."

  build_config {
    runtime     = "python311"
    entry_point = "regenerate_licks_fn"

    environment_variables = {
      GOOGLE_FUNCTION_SOURCE = "fn_regenerate_licks.py"
    }

    source {
      storage_source {
        bucket = google_storage_bucket.cf_source.name
        object = google_storage_bucket_object.backend_zip.name
      }
    }
  }

  service_config {
    available_memory               = var.regenerate_licks_memory
    available_cpu                  = var.regenerate_licks_cpu
    timeout_seconds                = var.regenerate_licks_timeout
    max_instance_count             = 2
    min_instance_count             = 0
    all_traffic_on_latest_revision = true

    service_account_email = google_service_account.cf_runtime_sa.email

    environment_variables = {
      GOOGLE_CLOUD_PROJECT = var.project_id
      FIRESTORE_DB         = var.db_name
      GCP_REGION           = var.region
    }
  }

  depends_on = [
    google_project_service.apis,
    google_storage_bucket_object.backend_zip,
  ]
}

resource "google_cloud_run_service_iam_member" "regenerate_licks_invoker" {
  project  = var.project_id
  location = var.region
  service  = google_cloudfunctions2_function.regenerate_licks.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api_gateway_sa.email}"
}

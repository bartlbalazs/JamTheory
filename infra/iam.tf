# ---------------------------------------------------------------------------
# Service accounts and IAM bindings.
#
# Two dedicated service accounts:
#   api-gateway-sa  — used by API Gateway to invoke Cloud Functions (Cloud Run)
#   cf-runtime-sa   — attached to both Cloud Functions at runtime
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# API Gateway service account
# ---------------------------------------------------------------------------

resource "google_service_account" "api_gateway_sa" {
  project      = var.project_id
  account_id   = "api-gateway-sa"
  display_name = "JamTheory API Gateway → Cloud Functions invoker"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "api_gateway_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.api_gateway_sa.email}"
}

# ---------------------------------------------------------------------------
# Cloud Function runtime service account
# ---------------------------------------------------------------------------

resource "google_service_account" "cf_runtime_sa" {
  project      = var.project_id
  account_id   = "cf-runtime-sa"
  display_name = "JamTheory Cloud Function runtime SA (Vertex AI, Firestore, Secrets)"

  depends_on = [google_project_service.apis]
}

# Vertex AI — needed to call Gemini models.
resource "google_project_iam_member" "cf_runtime_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cf_runtime_sa.email}"
}

# Firestore — read users, write backing-track cache (if ever needed server-side).
# Iteration 1 writes the cache client-side, but granting this keeps future
# server-side writes trivial without an IAM migration.
resource "google_project_iam_member" "cf_runtime_datastore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cf_runtime_sa.email}"
}

# Firebase Admin SDK token verification needs no special IAM role: the SDK
# verifies Firebase ID tokens by fetching public keys over HTTPS and
# validating the JWT signature locally. The previous grant of
# `roles/firebase.sdkAdminServiceAgent` was a service-agent role that GCP
# refuses to bind to user-managed SAs, and it was unnecessary anyway.

# Secret Manager — read YouTube API key at cold start.
resource "google_project_iam_member" "cf_runtime_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cf_runtime_sa.email}"
}

# Read objects from the Cloud Functions source bucket.
resource "google_project_iam_member" "cf_runtime_storage_object_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.cf_runtime_sa.email}"
}

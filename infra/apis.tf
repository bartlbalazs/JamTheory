# ---------------------------------------------------------------------------
# Enable all required GCP APIs.
# disable_on_destroy = false keeps APIs enabled if terraform destroy runs.
# ---------------------------------------------------------------------------

locals {
  required_apis = [
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "firestore.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com",
    "aiplatform.googleapis.com",
    "apigateway.googleapis.com",
    "servicecontrol.googleapis.com",
    "servicemanagement.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "secretmanager.googleapis.com",
    "youtube.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

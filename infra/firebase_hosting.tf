# ---------------------------------------------------------------------------
# Firebase Hosting site and Web App registration.
#
# Terraform creates the Firebase site resource so it exists before
# `deploy.sh --hosting` runs `firebase deploy --only hosting`.
# Actual content upload is done by the Firebase CLI.
# ---------------------------------------------------------------------------

resource "google_firebase_web_app" "jamtheory" {
  provider     = google-beta
  project      = var.project_id
  display_name = var.firebase_app_display_name

  depends_on = [google_project_service.apis]
}

data "google_firebase_web_app_config" "jamtheory" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.jamtheory.app_id
}

resource "google_firebase_hosting_site" "jamtheory" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.project_id

  depends_on = [google_firebase_web_app.jamtheory]
}

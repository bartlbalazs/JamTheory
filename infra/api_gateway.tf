# ---------------------------------------------------------------------------
# API Gateway — validates Firebase JWTs at the edge and proxies to Cloud
# Functions. Required because the org policy denies unauthenticated CF invocations.
# ---------------------------------------------------------------------------

resource "google_api_gateway_api" "jamtheory" {
  provider     = google-beta
  project      = var.project_id
  api_id       = "jamtheory-api"
  display_name = "JamTheory API"

  depends_on = [google_project_service.apis]
}

resource "google_api_gateway_api_config" "jamtheory" {
  provider      = google-beta
  project       = var.project_id
  api           = google_api_gateway_api.jamtheory.api_id
  api_config_id = "jamtheory-config-${substr(md5(local.openapi_spec), 0, 8)}"
  display_name  = "JamTheory API config"

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(local.openapi_spec)
    }
  }

  gateway_config {
    backend_config {
      google_service_account = google_service_account.api_gateway_sa.email
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    google_cloudfunctions2_function.generate_masterclass,
    google_cloudfunctions2_function.regenerate_licks,
  ]
}

resource "google_api_gateway_gateway" "jamtheory" {
  provider     = google-beta
  project      = var.project_id
  region       = var.region
  api_config   = google_api_gateway_api_config.jamtheory.id
  gateway_id   = "jamtheory-gateway"
  display_name = "JamTheory API Gateway"

  depends_on = [google_api_gateway_api_config.jamtheory]
}

# ---------------------------------------------------------------------------
# Render the OpenAPI template with actual Cloud Function URLs.
# ---------------------------------------------------------------------------

locals {
  openapi_spec = templatefile("${path.module}/openapi.yaml.tpl", {
    project_id              = var.project_id
    generate_masterclass_url = google_cloudfunctions2_function.generate_masterclass.service_config[0].uri
    regenerate_licks_url     = google_cloudfunctions2_function.regenerate_licks.service_config[0].uri
  })
}

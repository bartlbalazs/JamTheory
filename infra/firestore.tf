# ---------------------------------------------------------------------------
# Firestore database — NATIVE mode (required for real-time listeners and
# the security-rule functions used in frontend/firestore.rules).
# ---------------------------------------------------------------------------

resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = var.db_name
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Prevent accidental data loss on `terraform destroy`. ABANDON detaches
  # the database from Terraform state without deleting it; you can re-import
  # later if you really want to remove it.
  deletion_policy = "ABANDON"

  depends_on = [google_project_service.apis]
}

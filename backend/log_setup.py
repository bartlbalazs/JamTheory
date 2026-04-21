"""
Logging setup for Cloud Functions (2nd gen) and local development.

Import this module once at the top of each Cloud Function entry point.
The module-level code runs exactly once per cold start and configures the
root logger appropriately for the environment.

  Production (Cloud Functions / Cloud Run):
    Uses google.cloud.logging.Client.setup_logging(), which attaches a
    StructuredLogHandler to the Python root logger. Log entries are emitted
    as JSON on stdout; the Cloud Run logging agent forwards them to Cloud
    Logging with the correct severity level.

  Local development (K_SERVICE env var is absent):
    Falls back to logging.basicConfig() for plain-text output to stderr.
"""

from __future__ import annotations

import logging
import os


def _configure() -> None:
    if os.getenv("K_SERVICE"):
        # Running on Cloud Functions 2nd gen / Cloud Run.
        import google.cloud.logging  # noqa: PLC0415

        client = google.cloud.logging.Client()
        client.setup_logging(log_level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)


_configure()

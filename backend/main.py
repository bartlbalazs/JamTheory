"""
JamTheory Backend — local development FastAPI server.

This file is NOT deployed to production. In production each handler is a
separate Cloud Function (fn_generate_masterclass.py, fn_regenerate_licks.py).

Locally this server bundles both Cloud Function handlers as standard FastAPI
POST endpoints so they can be exercised via the Vite dev app, curl, or the
Swagger UI at http://localhost:8000/docs.

The Firebase Callable wire protocol is preserved:
  - Request body:  { "data": { ...args... } }
  - Success body:  { "result": { ... } }
  - Error body:    { "error": { "status": "...", "message": "..." } }
"""

from __future__ import annotations

import json
import logging
import os

import firebase_admin
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from firebase_admin import credentials

from fn_generate_masterclass import generate_masterclass_fn
from fn_regenerate_licks import regenerate_licks_fn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Firebase Admin SDK — initialised once at startup, pointed at the local
# Auth emulator. This file is never deployed to production, so hardcoding
# the emulator host here is safe.
# ---------------------------------------------------------------------------


def _init_firebase() -> None:
    if firebase_admin._DEFAULT_APP_NAME in firebase_admin._apps:
        return
    os.environ.setdefault("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099")
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cred = credentials.Certificate(cred_path) if cred_path else credentials.ApplicationDefault()
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "demo-jamtheory")
    firebase_admin.initialize_app(cred, {"projectId": project_id})
    logger.info("Firebase Admin SDK initialised (project=%s)", project_id)


app = FastAPI(
    title="JamTheory Backend (local dev)",
    description=(
        "Local development server bundling both Cloud Function handlers. "
        'Uses the Firebase Callable wire protocol: send {"data": {...}} '
        'and receive {"result": {...}} or {"error": {...}}.'
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    _init_firebase()


# ---------------------------------------------------------------------------
# Flask-Request-compatible shim wrapping the FastAPI Request body + headers.
# ---------------------------------------------------------------------------


class _FlaskRequestShim:
    def __init__(self, body: bytes, headers, method: str) -> None:
        self._body = body
        self.headers = headers
        self.method = method

    def get_json(self, silent: bool = False):  # noqa: ANN201
        try:
            return json.loads(self._body)
        except Exception:
            if silent:
                return None
            raise


async def _shim(request: Request) -> _FlaskRequestShim:
    body = await request.body()
    # Starlette Headers object has case-insensitive .get() — don't coerce to dict.
    return _FlaskRequestShim(body, request.headers, request.method)


@app.post("/generate-masterclass", summary="Generate a full masterclass payload")
async def generate_masterclass_endpoint(request: Request) -> JSONResponse:
    shim = await _shim(request)
    result = generate_masterclass_fn(shim)
    body, status = result[0], result[1]
    return JSONResponse(content=body, status_code=status)


@app.post("/regenerate-licks", summary="Regenerate 3 AlphaTex licks for a cached track")
async def regenerate_licks_endpoint(request: Request) -> JSONResponse:
    shim = await _shim(request)
    result = regenerate_licks_fn(shim)
    body, status = result[0], result[1]
    return JSONResponse(content=body, status_code=status)

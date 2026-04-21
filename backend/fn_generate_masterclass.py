"""
Cloud Function entry point: generate_masterclass

Deployed as a 2nd-gen Cloud Function (HTTP trigger). Invoked only by the
API Gateway service account (`roles/run.invoker` on `api-gateway-sa`).

Firebase Callable wire protocol:
  Request:  POST /
            Authorization: Bearer <firebase-id-token> (local dev)
            Content-Type: application/json
            Body:
              {
                "data": {
                  "youtubeVideoId": "dQw4w9WgXcQ",
                  "skillLevel": "Intermediate",
                  "userChords": "Am - Dm - E7",   // optional
                  "idToken": "<firebase-id-token>"
                }
              }

  Success (masterclass):
    { "result": { "trackInfo": {...}, "rhythmSection": {...}, "leadSection": {...} } }

  Success (chord fallback — no chords in description, no userChords provided):
    { "result": { "needsChords": true } }

  Error:
    { "error": { "status": "...", "message": "..." } }
"""

from __future__ import annotations

import logging
import os

import firebase_admin
import flask
import functions_framework
from firebase_admin import credentials

import log_setup  # noqa: F401 — configures root logger for Cloud Logging
from callable_helpers import (
    callable_error,
    callable_response,
    cors_preflight,
    parse_callable_request,
    verify_firebase_token,
)
from models import Masterclass, SkillLevel
from prompts import MASTERCLASS_SYSTEM_PROMPT, MASTERCLASS_USER_PROMPT
from services.chord_parser import description_has_chords
from services.gemini_client import GeminiError, generate_structured
from services.youtube_metadata import YouTubeMetadataError, fetch_video_metadata

logger = logging.getLogger(__name__)

_MAX_DESCRIPTION_CHARS = 4000


def _init_firebase() -> None:
    if firebase_admin._DEFAULT_APP_NAME in firebase_admin._apps:
        return
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cred = credentials.Certificate(cred_path) if cred_path else credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})


@functions_framework.http
def generate_masterclass_fn(request: flask.Request) -> tuple:
    """HTTP Cloud Function entry point for full masterclass generation."""
    if request.method == "OPTIONS":
        return cors_preflight()

    _init_firebase()

    # 1. Auth
    try:
        _ = verify_firebase_token(request)
    except PermissionError as exc:
        return callable_error("UNAUTHENTICATED", str(exc), 401)

    # 2. Parse request
    try:
        data = parse_callable_request(request)
        video_id = data.get("youtubeVideoId")
        if not video_id or not isinstance(video_id, str):
            raise ValueError("youtubeVideoId must be a non-empty string.")
        skill_raw = data.get("skillLevel")
        try:
            skill_level = SkillLevel(skill_raw)
        except ValueError as exc:
            raise ValueError(f"skillLevel must be one of {[s.value for s in SkillLevel]}.") from exc
        user_chords = (data.get("userChords") or "").strip()
    except (ValueError, KeyError) as exc:
        return callable_error("INVALID_ARGUMENT", str(exc), 400)

    # 3. Fetch YouTube metadata
    try:
        meta = fetch_video_metadata(video_id)
    except YouTubeMetadataError as exc:
        return callable_error("NOT_FOUND", str(exc), 404)

    # 4. Chord-fallback check. If the description lacks recognisable chords
    #    AND the caller didn't pass a manual progression, ask for one.
    if not user_chords and not description_has_chords(meta.description):
        logger.info("No chords detected in description for videoId=%s — asking user.", video_id)
        return callable_response({"needsChords": True})

    # 5. Generate masterclass via Gemini
    truncated_description = meta.description[:_MAX_DESCRIPTION_CHARS]
    user_prompt = MASTERCLASS_USER_PROMPT.format(
        title=meta.title,
        description=truncated_description,
        user_chords=user_chords or "(none)",
        skill_level=skill_level.value,
    )

    try:
        result = generate_structured(
            system_prompt=MASTERCLASS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=Masterclass,
            temperature=0.6,
        )
    except GeminiError as exc:
        logger.exception("Gemini generation failed for videoId=%s", video_id)
        return callable_error("INTERNAL", f"Generation failed: {exc}", 500)

    logger.info("Masterclass generated for videoId=%s skill=%s", video_id, skill_level.value)

    # 6. Return the masterclass JSON plus the YouTube title/description so the
    #    frontend can cache-write `backing_tracks/{videoId}` with real data.
    #    The FRONTEND writes the cached document — see firestore.rules.
    payload = result.model_dump(by_alias=True)
    payload["title"] = meta.title
    payload["description"] = meta.description
    return callable_response(payload)

"""
Cloud Function entry point: regenerate_licks

Generates 3 fresh vocabulary licks (Easy, Medium, Hard) for a cached
backing track, without touching the rest of the masterclass document.

Firebase Callable wire protocol:
  Request body:
    {
      "data": {
        "key": "A Minor",
        "genre": "Texas Blues",
        "skillLevel": "Intermediate",
        "idToken": "<firebase-id-token>"
      }
    }

  Success:
    {
      "result": {
        "licks": [
          { "difficulty": "Easy",   "description": "...", "alphatex": "..." },
          { "difficulty": "Medium", "description": "...", "alphatex": "..." },
          { "difficulty": "Hard",   "description": "...", "alphatex": "..." }
        ]
      }
    }
"""

from __future__ import annotations

import logging
import os

import firebase_admin
import flask
import functions_framework
from firebase_admin import credentials

import log_setup  # noqa: F401
from callable_helpers import (
    callable_error,
    callable_response,
    cors_preflight,
    parse_callable_request,
    verify_firebase_token,
)
from models import RegenerateLicksResult, SkillLevel
from prompts import RELICKS_SYSTEM_PROMPT, RELICKS_USER_PROMPT
from services.gemini_client import GeminiError, generate_structured

logger = logging.getLogger(__name__)


def _init_firebase() -> None:
    if firebase_admin._DEFAULT_APP_NAME in firebase_admin._apps:
        return
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cred = credentials.Certificate(cred_path) if cred_path else credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})


@functions_framework.http
def regenerate_licks_fn(request: flask.Request) -> tuple:
    """HTTP Cloud Function entry point for the Generate New Licks action."""
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
        key = (data.get("key") or "").strip()
        genre = (data.get("genre") or "").strip()
        if not key:
            raise ValueError("'key' must be a non-empty string.")
        if not genre:
            raise ValueError("'genre' must be a non-empty string.")
        try:
            skill_level = SkillLevel(data.get("skillLevel"))
        except ValueError as exc:
            raise ValueError(f"skillLevel must be one of {[s.value for s in SkillLevel]}.") from exc
    except (ValueError, KeyError) as exc:
        return callable_error("INVALID_ARGUMENT", str(exc), 400)

    # 3. Generate via Gemini. Higher temperature than the main masterclass
    #    call — fresh licks every time.
    user_prompt = RELICKS_USER_PROMPT.format(
        key=key,
        genre=genre,
        skill_level=skill_level.value,
    )

    try:
        result = generate_structured(
            system_prompt=RELICKS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=RegenerateLicksResult,
            temperature=0.95,
        )
    except GeminiError as exc:
        logger.exception("Gemini lick regeneration failed (key=%s genre=%s)", key, genre)
        return callable_error("INTERNAL", f"Generation failed: {exc}", 500)

    logger.info("Regenerated 3 licks for key=%s genre=%s skill=%s", key, genre, skill_level.value)

    return callable_response(result.model_dump(by_alias=True))

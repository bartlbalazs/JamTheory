"""
Gemini client wrapper for JamTheory.

Uses the google-genai SDK against Vertex AI. The model id is taken from
``GEMINI_MODEL`` (default: ``gemini-3.1-pro-preview``, matching the Daskalo
reference project).

Both callers (`generate_masterclass` and `regenerate_licks`) pass their own
Pydantic model as the ``response_schema`` to force strict JSON output that
the SDK auto-parses back into a typed object.
"""

from __future__ import annotations

import logging
import os
from typing import TypeVar

from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)


DEFAULT_MODEL = "gemini-3.1-pro-preview"


class GeminiError(Exception):
    """Raised for any failure while calling Gemini or parsing its response."""


T = TypeVar("T", bound=BaseModel)


def _client() -> genai.Client:
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "europe-west1")
    if not project:
        raise GeminiError("GOOGLE_CLOUD_PROJECT env var is not set.")
    return genai.Client(vertexai=True, project=project, location=location)


def generate_structured(
    *,
    system_prompt: str,
    user_prompt: str,
    response_model: type[T],
    temperature: float = 0.7,
) -> T:
    """Call Gemini and return a parsed Pydantic object of ``response_model``.

    Raises ``GeminiError`` on any transport or parsing failure.
    """
    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
    client = _client()

    config = genai_types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=temperature,
        response_mime_type="application/json",
        response_schema=response_model,
    )

    try:
        response = client.models.generate_content(
            model=model,
            contents=user_prompt,
            config=config,
        )
    except Exception as exc:
        logger.exception("Gemini generate_content call failed.")
        raise GeminiError(f"Gemini API call failed: {exc}") from exc

    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, response_model):
        return parsed

    # Fall back to parsing the raw text.
    raw_text = getattr(response, "text", None)
    if not raw_text:
        raise GeminiError("Gemini returned an empty response.")

    try:
        return response_model.model_validate_json(raw_text)
    except ValidationError as exc:
        logger.warning("Gemini response failed schema validation: %s", exc)
        raise GeminiError(f"Gemini response did not match schema: {exc}") from exc

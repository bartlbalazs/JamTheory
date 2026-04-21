"""
YouTube metadata service — fetches the title and description of a video via
the YouTube Data API v3.

The API key is read from the ``YOUTUBE_API_KEY`` env var. In production this
is injected by Terraform via Secret Manager; locally it is set in
``backend/.env.local``.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


class YouTubeMetadataError(Exception):
    """Raised when metadata cannot be fetched or the video does not exist."""


@dataclass(frozen=True)
class VideoMetadata:
    video_id: str
    title: str
    description: str
    channel_title: str


def fetch_video_metadata(video_id: str) -> VideoMetadata:
    """Fetch title + description for a YouTube video ID.

    Raises ``YouTubeMetadataError`` when the API key is missing, the call
    fails, or the video is not found / unavailable.
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise YouTubeMetadataError("YOUTUBE_API_KEY env var is not set.")

    if not video_id or not isinstance(video_id, str):
        raise YouTubeMetadataError("video_id must be a non-empty string.")

    try:
        # developerKey auth → no OAuth scopes needed.
        # cache_discovery=False avoids a file-system cache that Cloud Functions cannot write to.
        youtube = build("youtube", "v3", developerKey=api_key, cache_discovery=False)
        response = youtube.videos().list(part="snippet", id=video_id, maxResults=1).execute()
    except HttpError as exc:
        logger.warning("YouTube Data API error for videoId=%s: %s", video_id, exc)
        raise YouTubeMetadataError(f"YouTube Data API error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected YouTube metadata error for videoId=%s", video_id)
        raise YouTubeMetadataError("Unexpected error while calling YouTube API.") from exc

    items = response.get("items") or []
    if not items:
        raise YouTubeMetadataError(f"Video '{video_id}' not found or unavailable.")

    snippet = items[0].get("snippet") or {}
    return VideoMetadata(
        video_id=video_id,
        title=(snippet.get("title") or "").strip(),
        description=(snippet.get("description") or "").strip(),
        channel_title=(snippet.get("channelTitle") or "").strip(),
    )

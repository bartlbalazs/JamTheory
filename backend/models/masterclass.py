"""
Pydantic v2 models mirroring the masterclass JSON schema.

These models are BOTH:
  - the single source of truth for the backend,
  - the `response_schema` passed to Gemini to force strict JSON output.

They must stay in sync with:
  - shared/schemas/masterclass.schema.json
  - frontend/src/types/masterclass.ts
  - docs/DATA_MODEL.md
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, StringConstraints
from typing_extensions import Annotated


class SkillLevel(str, Enum):
    beginner = "Beginner"
    intermediate = "Intermediate"
    advanced = "Advanced"


class Difficulty(str, Enum):
    easy = "Easy"
    medium = "Medium"
    hard = "Hard"


NonEmptyStr = Annotated[str, StringConstraints(min_length=1)]


# ---------------------------------------------------------------------------
# Track-level metadata
# ---------------------------------------------------------------------------


class TrackInfo(BaseModel):
    key: NonEmptyStr = Field(description="Musical key, e.g. 'A Minor'.")
    genre: NonEmptyStr = Field(description="Genre or style, e.g. 'Texas Blues'.")
    theory_summary: NonEmptyStr = Field(
        alias="theorySummary",
        description="Plain-English harmonic context, 1-3 sentences.",
    )

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Rhythm section
# ---------------------------------------------------------------------------


class Chord(BaseModel):
    name: NonEmptyStr = Field(description="Chord name, e.g. 'Am7'.")
    frets: Annotated[
        str,
        StringConstraints(min_length=6, max_length=6),
    ] = Field(
        description=(
            "Low-to-high fret notation over 6 strings. 'x' means muted; "
            "digits 0-9 are fret numbers. Example 'x02210'. "
            "Exactly 6 characters."
        )
    )


class RhythmSection(BaseModel):
    chords: list[Chord] = Field(min_length=1)
    strumming_advice: NonEmptyStr = Field(alias="strummingAdvice")

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Lead section
# ---------------------------------------------------------------------------


class PrimaryScale(BaseModel):
    name: NonEmptyStr = Field(description="Scale name, e.g. 'A Minor Pentatonic'.")
    root_fret: int = Field(alias="rootFret", ge=0, le=24)

    model_config = {"populate_by_name": True}


class TargetNote(BaseModel):
    chord: NonEmptyStr
    note: NonEmptyStr
    advice: NonEmptyStr


class Lick(BaseModel):
    difficulty: Difficulty
    description: NonEmptyStr
    alphatex: NonEmptyStr = Field(
        description=("Strict AlphaTex syntax. ASCII tablature is NOT permitted anywhere in the system.")
    )


class LeadSection(BaseModel):
    primary_scale: PrimaryScale = Field(alias="primaryScale")
    target_notes: list[TargetNote] = Field(alias="targetNotes", default_factory=list)
    vocabulary_licks: list[Lick] = Field(
        alias="vocabularyLicks",
        min_length=3,
        max_length=3,
        description="EXACTLY 3 licks, one Easy, one Medium, one Hard, in that order.",
    )

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Top-level payloads
# ---------------------------------------------------------------------------


class Masterclass(BaseModel):
    """Full masterclass payload returned by /generate-masterclass."""

    track_info: TrackInfo = Field(alias="trackInfo")
    rhythm_section: RhythmSection = Field(alias="rhythmSection")
    lead_section: LeadSection = Field(alias="leadSection")

    model_config = {"populate_by_name": True}


class RegenerateLicksResult(BaseModel):
    """Payload returned by /regenerate-licks."""

    licks: list[Lick] = Field(min_length=3, max_length=3)

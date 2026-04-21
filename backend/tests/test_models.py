"""Smoke tests for the Pydantic masterclass models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from models import Chord, Lick, Masterclass


def _valid_masterclass_dict() -> dict:
    return {
        "trackInfo": {
            "key": "A Minor",
            "genre": "Texas Blues",
            "theorySummary": "Standard 12-bar blues using dominant chords.",
        },
        "rhythmSection": {
            "chords": [
                {"name": "A7", "frets": "x02020"},
                {"name": "D7", "frets": "xx0212"},
                {"name": "E7", "frets": "020100"},
            ],
            "strummingAdvice": "Shuffle feel on beats 2 and 4.",
        },
        "leadSection": {
            "primaryScale": {"name": "A Minor Pentatonic", "rootFret": 5},
            "targetNotes": [{"chord": "D7", "note": "F#", "advice": "Hit the major 3rd."}],
            "vocabularyLicks": [
                {
                    "difficulty": "Easy",
                    "description": "Simple box-1 phrase.",
                    "alphatex": "\\track 'Lead' \\staff { 5.2.4 7.2.4 | }",
                },
                {
                    "difficulty": "Medium",
                    "description": "Bend on the b7.",
                    "alphatex": "\\track 'Lead' \\staff { 7.3.2{b} 5.2.2 | }",
                },
                {
                    "difficulty": "Hard",
                    "description": "Hybrid picking double stops.",
                    "alphatex": "\\track 'Lead' \\staff { 8.2.4 10.1.4 | }",
                },
            ],
        },
    }


def test_masterclass_parses_valid_payload() -> None:
    m = Masterclass.model_validate(_valid_masterclass_dict())
    assert m.track_info.key == "A Minor"
    assert len(m.lead_section.vocabulary_licks) == 3
    assert [l.difficulty.value for l in m.lead_section.vocabulary_licks] == [
        "Easy",
        "Medium",
        "Hard",
    ]


def test_masterclass_requires_exactly_three_licks() -> None:
    payload = _valid_masterclass_dict()
    payload["leadSection"]["vocabularyLicks"].pop()
    with pytest.raises(ValidationError):
        Masterclass.model_validate(payload)


def test_chord_frets_must_be_six_chars() -> None:
    with pytest.raises(ValidationError):
        Chord.model_validate({"name": "A7", "frets": "x0202"})  # 5 chars
    with pytest.raises(ValidationError):
        Chord.model_validate({"name": "A7", "frets": "x020200"})  # 7 chars


def test_lick_difficulty_enum_enforced() -> None:
    with pytest.raises(ValidationError):
        Lick.model_validate({"difficulty": "Expert", "description": "x", "alphatex": "y"})

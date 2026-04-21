"""
Chord-detection helper used by the ``generate-masterclass`` function.

The spec (``jam_feature.md`` §3.B.5) requires a regex-based fallback: if the
YouTube description does not contain any recognisable chord symbols, we must
pause and ask the user to provide the progression manually.

This module is intentionally simple. We detect:
  - plain chord names: C, D, Em, Am7, Cmaj7, F#m, Bb, C7b9, D9, ...
  - Roman-numeral progressions: I-IV-V, i-iv-V, ii-V-I, etc.

It is NOT a full music parser — only a binary "looks like chords are
mentioned" heuristic.
"""

from __future__ import annotations

import re

# Plain chord pattern. Covers:
#   root:   A-G with optional accidental (# or b)
#   quality: optional m / maj / min / dim / aug / sus
#   extension: optional numbers (7, 9, 11, 13) + optional alteration (b5, #9, ...)
#   bass:    optional slash bass ("/G", "/F#")
_CHORD_PATTERN = re.compile(
    r"""
    \b
    [A-G]                       # root
    (?:\#|b)?                   # optional accidental
    (?:                         # optional quality / extension
        m(?:aj|in)?             #   m / maj / min
      | dim | aug | sus
    )?
    (?:\d{1,2})?                # optional number extension: 7, 9, 11, 13, ...
    (?:
        (?:b|\#)\d{1,2}         #   optional alteration (b9, #11)
    )*
    (?:
        /[A-G](?:\#|b)?         #   optional slash-bass
    )?
    \b
    """,
    re.VERBOSE,
)

# Roman numeral progressions (I-IV-V, ii-V-I, etc.). Require at least two
# numerals separated by hyphens to avoid false positives on a stray "V".
_ROMAN_NUMERAL_PATTERN = re.compile(
    r"\b(?:VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(?:\s*-\s*(?:VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)){1,}\b"
)

# Single-letter false-positive guard: the plain-chord pattern can match
# words that start with a single A-G letter followed by nothing. Require at
# least two chord hits to count as "chords detected".
_MIN_CHORD_HITS = 2


def description_has_chords(text: str) -> bool:
    """Return True if the given text plausibly mentions chord names.

    The caller should pass the YouTube description. ``True`` means we can
    proceed with Gemini generation; ``False`` means we must prompt the user
    to supply the chord progression explicitly.
    """
    if not text:
        return False

    if _ROMAN_NUMERAL_PATTERN.search(text):
        return True

    # Count chord-like tokens. We scan over all matches and filter obvious
    # false positives: single-letter matches (a bare "A", "C", "E", ...) are
    # almost always English words or sentence starters, not chord names.
    # Real chord mentions are typically written with an accidental, quality,
    # or extension (e.g. "Am", "C7", "F#m"), or in a chord-chart-like run
    # of single letters separated by spaces — but the latter is still
    # ambiguous enough that we prefer the Roman-numeral branch above.
    matches = [m.group(0) for m in _CHORD_PATTERN.finditer(text)]
    meaningful = [m for m in matches if len(m) > 1]
    return len(meaningful) >= _MIN_CHORD_HITS


def extract_video_id(url_or_id: str) -> str | None:
    """Return the 11-character YouTube video ID from a URL or bare ID.

    Returns None if the input doesn't look like a YouTube video reference.
    """
    if not url_or_id:
        return None

    candidate = url_or_id.strip()

    # Already a bare 11-char ID.
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
        return candidate

    # youtu.be/<id>
    m = re.search(r"youtu\.be/([A-Za-z0-9_-]{11})", candidate)
    if m:
        return m.group(1)

    # youtube.com/watch?v=<id>
    m = re.search(r"[?&]v=([A-Za-z0-9_-]{11})", candidate)
    if m:
        return m.group(1)

    # youtube.com/embed/<id>, youtube.com/shorts/<id>, youtube.com/live/<id>
    m = re.search(r"youtube\.com/(?:embed|shorts|live)/([A-Za-z0-9_-]{11})", candidate)
    if m:
        return m.group(1)

    return None

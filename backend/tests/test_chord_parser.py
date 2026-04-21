"""Tests for the chord_parser service."""

from __future__ import annotations

from services.chord_parser import description_has_chords, extract_video_id


class TestDescriptionHasChords:
    def test_plain_chord_list(self) -> None:
        assert description_has_chords("Key: A minor. Chords: Am - Dm - E7")

    def test_chord_with_extensions(self) -> None:
        assert description_has_chords("Progression uses Am7, D9 and Cmaj7.")

    def test_roman_numerals(self) -> None:
        assert description_has_chords("12-bar blues: I - IV - V")

    def test_sharp_and_flat(self) -> None:
        assert description_has_chords("Try F#m and Bb over the turnaround.")

    def test_slash_bass(self) -> None:
        assert description_has_chords("C/G - F/A - G/B is a classic bassline move.")

    def test_empty(self) -> None:
        assert not description_has_chords("")

    def test_plain_english_without_chords(self) -> None:
        assert not description_has_chords("This backing track is perfect for practice. Enjoy and subscribe!")

    def test_single_letters_in_prose_are_not_chords(self) -> None:
        # Regression: the plain-chord regex matches bare A/B/C/D/E/F/G. Prose
        # sentences often contain several of these as words or sentence
        # starters; they must NOT count as chords.
        assert not description_has_chords(
            "A classic track. F you liked this video, subscribe! E-mail me at bob@example.com. C you next time."
        )

    def test_single_chord_mention_is_not_enough(self) -> None:
        # One chord-like token isn't a progression; require at least two.
        assert not description_has_chords("I wrote this in Am one evening.")


class TestExtractVideoId:
    def test_bare_id(self) -> None:
        assert extract_video_id("dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    def test_standard_watch_url(self) -> None:
        assert extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    def test_short_url(self) -> None:
        assert extract_video_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    def test_embed_url(self) -> None:
        assert extract_video_id("https://www.youtube.com/embed/dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    def test_shorts_url(self) -> None:
        assert extract_video_id("https://www.youtube.com/shorts/dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    def test_invalid(self) -> None:
        assert extract_video_id("https://example.com/not-youtube") is None
        assert extract_video_id("") is None

# JamTheory Roadmap

Iteration 1 — the scope of the current codebase — covers **The Backing
Track Masterclass only**. Everything on this page is **deliberately out of
scope today** and must not be implemented without an explicit product-level
decision to start a new iteration.

The features below are tracked here so that:
- future agents / contributors don't re-propose them,
- architectural decisions today can stay compatible with tomorrow, and
- we don't forget the long-term vision.

---

## Iteration 2 — The Lesson Orchestrator

Timed, Pomodoro-style practice routines extracted from YouTube guitar lessons.

**Product sketch**
- User pastes a guitar lesson video URL.
- Backend extracts the lesson structure (intro, theory, exercises, jam
  sections) from the video's transcript + chapter markers (YouTube Data API
  `videos.list` with `chapters` + `captions.download`).
- Gemini converts that into a timed routine:
  `[ { block: "warm-up", minutes: 5, instructions: "..." }, ... ]`.
- Frontend plays the timer and shows instructions for each block.

**New components**
- Transcript fetcher service in `backend/services/youtube_transcript.py`.
- `generate_lesson_plan_fn` Cloud Function.
- New Firestore subcollection `backing_tracks/{videoId}/lesson_plans/{skillLevel}`
  (or a new top-level `lessons/` — decide during spec work).
- Timer + block-stepper React components.

---

## Iteration 3 — On-Demand Diagnostics

Multimodal audio/vision analysis of the user's playing posture and tone.

**Product sketch**
- User enables webcam + microphone in-app.
- Short clip (e.g. 15 s) is uploaded to GCS.
- A new Cloud Function calls Gemini multimodal with the clip and returns
  posture + tone feedback.
- Result is rendered as a diagnostic card alongside the masterclass.

**New infrastructure**
- Public-ish (signed-URL) GCS bucket for webcam uploads.
- Lifecycle rules to purge clips after N days.
- `diagnose_playing_fn` Cloud Function with increased memory (~2 Gi).

**Open questions**
- Privacy model: user-scoped vs. deleted immediately after analysis.
- Fallback when microphone/webcam permissions denied.

---

## Iteration 4 — Proof of Work

Automatic webcam recording of progress milestones saved to cloud storage.

**Product sketch**
- Before/after recordings of jam sessions, automatically tagged with the
  backing track and skill level.
- Timeline view shows progress across weeks / months.

**New infrastructure**
- Dedicated user-scoped GCS bucket or prefix (`progress-recordings`).
- Playback UI with thumbnails.
- Retention policy + billing considerations (video is expensive to store).

---

## Quick-win follow-ups (post-iteration 1, not new iterations)

- **Metronome** next to the stopwatch.
- **Loop-play markers** over the YouTube player so the user can A/B loop a
  section of the backing track.
- **Export practice logs** to CSV.
- **Mobile layout** — today everything is desktop-first single-screen.
- **Theme switching** (dark mode first-class; currently dark-only).
- **User-editable masterclass corrections** — "this chord is wrong, let me
  fix it" → write to a `corrections` subcollection, never overwrite the
  cached variant.

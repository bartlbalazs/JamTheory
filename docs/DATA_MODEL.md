# JamTheory Firestore Data Model

Strict adherence to this schema is required across all components.

> **Naming:** Firebase convention — collection names are lowercase with
> underscores. The product spec (`jam_feature.md`) uses PascalCase
> (`Users`, `Backing_Tracks`); we deliberately deviate. Field names are
> `camelCase` consistent with TypeScript and JavaScript Firestore SDKs.

---

## 1. Top-level collections

### `users`

Documents representing authenticated guitarists.

**Document ID:** `{firebase_uid}`

```json
{
  "email": "user@example.com",
  "displayName": "Alex Player",
  "status": "pending",
  "skillLevel": "Intermediate",
  "createdAt": "Timestamp",
  "lastActive": "Timestamp"
}
```

- `status` — enum `"pending" | "active"`. Created as `"pending"` on first
  sign-in. An admin flips it to `"active"` via the Firebase Console.
- `skillLevel` — enum `"Beginner" | "Intermediate" | "Advanced"`. Set on
  the first-time onboarding modal. Drives the Gemini prompt.

---

### `users/{uid}/practice_logs/{autoId}` (subcollection)

One document per completed practice session.

```json
{
  "youtubeVideoId": "dQw4w9WgXcQ",
  "date": "2026-04-21T12:00:00Z",
  "minutesPlayed": 25
}
```

- `minutesPlayed` — integer. The frontend rounds elapsed seconds up to the
  nearest minute.

---

### `backing_tracks/{videoId}`

Video-level metadata. Created once per unique YouTube video.

**Document ID:** the YouTube video ID (e.g. `dQw4w9WgXcQ`).

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Slow Blues Backing Track in A Minor - 70 BPM",
  "description": "Key: A Minor | Tempo: 70 BPM | Chords: Am - Dm - E7 ...",
  "createdAt": "Timestamp",
  "createdByUid": "{firebase_uid}"
}
```

Writes are **create-only** from the client — see
`frontend/firestore.rules`. Updates and deletes are denied. The title and
description are captured once for debugging / auditing.

---

### `backing_tracks/{videoId}/variants/{skillLevel}` (subcollection)

One document per `skillLevel` variant of the masterclass. Cache key is the
skill level string — `"Beginner"`, `"Intermediate"`, `"Advanced"`.

```json
{
  "skillLevel": "Intermediate",
  "createdAt": "Timestamp",
  "createdByUid": "{firebase_uid}",

  "trackInfo": {
    "key": "A Minor",
    "genre": "Texas Blues",
    "theorySummary": "Standard 12-bar blues in A minor using dominant chords."
  },

  "rhythmSection": {
    "chords": [
      { "name": "Am7", "frets": "5x555x" },
      { "name": "D9",  "frets": "x5455x" }
    ],
    "strummingAdvice": "Shuffle feel on beats 2 and 4."
  },

  "leadSection": {
    "primaryScale": {
      "name": "A Minor Pentatonic",
      "rootFret": 5
    },
    "targetNotes": [
      { "chord": "D9", "note": "F#", "advice": "Highlight the major 3rd." }
    ],
    "vocabularyLicks": [
      {
        "difficulty": "Easy",
        "description": "Albert King style double-stop bend.",
        "alphatex": "\\track 'Lead' \\staff { 5.2.4 5.1.4 | 7.3.2{b} | }"
      },
      { "difficulty": "Medium", "description": "...", "alphatex": "..." },
      { "difficulty": "Hard",   "description": "...", "alphatex": "..." }
    ]
  }
}
```

### Invariants

- `vocabularyLicks` **must contain exactly 3 entries**, one each of
  `"Easy"`, `"Medium"`, `"Hard"` (in that order).
- `alphatex` values are AlphaTex strings only. ASCII tablature is forbidden
  anywhere in the system.
- `chords[].frets` uses 6-character low-to-high fret notation (e.g.
  `"x02210"`), where `x` means muted.
- Variant documents are **immutable** (create-only). To get fresh licks
  without overwriting the rest of the payload, call the `regenerate-licks`
  Cloud Function — the response is displayed in memory only.

---

## 2. Request / response shapes (backend)

### `POST /generate-masterclass`

Request (Callable envelope):

```json
{
  "data": {
    "youtubeVideoId": "dQw4w9WgXcQ",
    "skillLevel": "Intermediate",
    "userChords": "Am - Dm - E7",
    "idToken": "<firebase-jwt>"
  }
}
```

Success response:

```json
{
  "result": {
    "trackInfo":     { ... },
    "rhythmSection": { ... },
    "leadSection":   { ... }
  }
}
```

Chord-fallback response (when the description has no chords and no
`userChords` was provided):

```json
{
  "result": { "needsChords": true }
}
```

### `POST /regenerate-licks`

Request:

```json
{
  "data": {
    "key": "A Minor",
    "genre": "Texas Blues",
    "skillLevel": "Intermediate",
    "idToken": "<firebase-jwt>"
  }
}
```

Success response:

```json
{
  "result": {
    "licks": [
      { "difficulty": "Easy",   "description": "...", "alphatex": "..." },
      { "difficulty": "Medium", "description": "...", "alphatex": "..." },
      { "difficulty": "Hard",   "description": "...", "alphatex": "..." }
    ]
  }
}
```

---

## 3. Cross-cut schema

`shared/schemas/masterclass.schema.json` is the single source of truth for
the masterclass payload shape. Backend Pydantic models and frontend TS
types must both match it.

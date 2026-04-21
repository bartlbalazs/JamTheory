Here is the comprehensive Master Product Specification Document. It is structured explicitly for an AI coding agent (like OpenCode), providing the exact architectural boundaries, data models, UI layouts, and logic flows needed to build the app without hallucinating unnecessary features.

---

# **Master Product Specification: "The Silent Supervisor" Guitar Coach**

## **1\. Product Vision & Full App Concept**

"The Silent Supervisor" is a browser-based, AI-orchestrated practice environment for intermediate guitarists. It abandons the "chatty AI chatbot" paradigm. Instead, it acts as a strict, data-driven coach that uses AI to ingest content (YouTube videos), extract musical theory, and generate highly structured, visual practice dashboards.

The full conceptual vision includes:

1. **The Backing Track Masterclass:** Dynamic generation of theory, diagrams, and tablature from YouTube backing tracks.  
2. **The Lesson Orchestrator:** Timed, Pomodoro-style practice routines extracted from YouTube guitar lessons.  
3. **On-Demand Diagnostics:** Multimodal audio/vision analysis of the user's playing posture and tone.  
4. **Proof of Work:** Automatic webcam recording of progress milestones saved to cloud storage.

⚠️ **STRICT DEVELOPMENT MANDATE FOR AI AGENT:**  
Features 2, 3, and 4 (including any webcam, audio processing, or complex Pomodoro orchestration) are strictly **OUT OF SCOPE** for Iteration 1\.  
**Iteration 1 (MVP) is strictly limited to building "The Backing Track Masterclass", basic Firebase Auth, and simple session time-logging.**

---

## **2\. Core Architectural Decisions & Rationale**

*Provide this context to the AI agent so it understands the constraints of the system.*

* **Decision 1: No Chatbot UI.** The AI is a background data-parser, not a conversational agent. All AI outputs must be structured JSON mapped to a static, distraction-free UI.  
* **Decision 2: Metadata Extraction over Raw Audio Processing.** To keep API costs near zero, the app does *not* send audio streams to the LLM. It scrapes the YouTube video title and description, relying on the fact that 95% of backing tracks explicitly list the Key, Tempo, and Chords in the text.  
* **Decision 3: AlphaTex over ASCII Tabs.** LLMs hallucinate and misalign ASCII tablature. The LLM will be instructed to output standard `AlphaTex` syntax strings, which the frontend will render into professional sheet music using the `AlphaTab.js` library.  
* **Decision 4: Static over Dynamic Sync.** The fretboard diagrams and tabs are static visual references. The app does *not* attempt to sync the diagrams dynamically to the timestamps of the playing YouTube video.  
* **Decision 5: Desktop-First, Single Screen.** The UI is a single dashboard designed for desktop monitors to allow side-by-side viewing of the video and the practice materials.

---

## **3\. Iteration 1 Detail: The Backing Track Masterclass**

This is the sole feature to be implemented. The user pastes a YouTube backing track URL, and the app generates a curated "Jam Cheat Sheet" and practice environment.

### **A. The User Interface (Two-Column Desktop Layout)**

The screen is divided into two non-overlapping columns.

**Left Column: The Practice Zone (Fixed/Sticky)**

* **Input:** A text input field for the YouTube URL \+ "Generate Masterclass" button.  
* **Video Player:** Embedded YouTube iFrame.  
* **Session Stopwatch:** A simple timer (MM:SS) that counts up (free practice).  
* **End Session Action:** A "Finish & Log Session" button that stops the clock and saves the elapsed time to the database.

**Right Column: The Masterclass Content (Scrollable)**  
Renders the generated JSON into visual components, ordered Easy to Hard:

1. **Vibe & Theory:** Text block detailing the Key, Genre, and harmonic context.  
2. **Rhythm Guitar Foundation:** Fretboard diagrams of the chord progression \+ text advice for strumming.  
3. **Lead Guitar Fundamentals:** Fretboard diagram of the primary scale \+ text callouts for "Target/Money Notes" to land on during specific chord changes.  
4. **Vocabulary (Lick Blueprints):** Three AI-generated licks (Easy, Medium, Hard) rendered via `AlphaTab.js`.  
5. **Regenerate Button:** A "Generate New Licks" button beneath the vocabulary section.

### **B. The Application Flow & Fallback Logic**

1. **Auth & Setup:** User logs in via Google (Firebase Auth). If it's their first time, they select a Skill Level (Beginner, Intermediate, Advanced) saved to their profile.  
2. **Input:** User pastes URL. App extracts the YouTube Video ID.  
3. **Cache Check:** Frontend queries Firestore `Backing_Tracks/{Video_ID}`. If it exists, skip to Step 7\.  
4. **Metadata Scrape:** A serverless function fetches the YouTube title and description text.  
5. **Fallback Trigger (Crucial):** A regex checks the description text for chords (e.g., Am, Cmaj7, I-IV-V). If *no* chords are detected, the UI pauses and prompts the user: *"No chords found in the track description. Please type the chord progression here (e.g., C \- F \- G) to continue."*  
6. **AI Generation:** Metadata (and user chords, if applicable) \+ User Skill Level are sent to Gemini API via Structured JSON Output prompt. The response is cached in Firestore.  
7. **Render & Practice:** UI renders the JSON. User starts the stopwatch and jams.  
8. **Completion:** User clicks "Finish". App logs the Date, Video ID, and Minutes Played to Firestore.

---

## **4\. Technical Stack Requirements**

* **Frontend Framework:** React (Next.js or Vite).  
* **Styling:** Tailwind CSS.  
* **Backend/Database:** Firebase (Auth, Firestore, Cloud Functions).  
* **AI API:** Google Gemini API (Model: `gemini-3.0-flash` or `gemini-3.1-pro`). Must utilize `responseSchema` for strict JSON formatting.  
* **Libraries:**  
  * `react-youtube` or standard iFrame for video embedding.  
  * `react-fretboard` (or standard SVG drawing logic) for static chord/scale dots.  
  * `@coderline/alphatab` (AlphaTab) for rendering AlphaTex strings into tablature.  
  * `youtube-transcript-api` or a lightweight metadata scraper for the backend function.

---

## **5\. Database Schema (Firebase Firestore)**

The AI Agent must implement the following exact schema structures:

**Collection: `Users`**

```json
// Document ID: Firebase Auth UID
{
  "email": "user@example.com",
  "skill_level": "Intermediate", // Set on onboarding
  "created_at": "Timestamp"
}
```

**Collection: `Practice_Logs` (Subcollection under `Users/{UID}`)**

```json
// Document ID: Auto-generated
{
  "youtube_video_id": "dQw4w9WgXcQ",
  "date": "2026-04-18T12:00:00Z",
  "minutes_played": 25
}
```

**Collection: `Backing_Tracks` (Global Cache)**

```json
// Document ID: YouTube Video ID (e.g., dQw4w9WgXcQ)
{
  "youtube_url": "https://...",
  "track_info": {
    "key": "A Minor",
    "genre": "Texas Blues",
    "theory_summary": "Standard 12-bar blues..."
  },
  "rhythm_section": {
    "chords": [
      {"name": "Am7", "frets": "5x555x"}, // Format suitable for fretboard library
      {"name": "D9", "frets": "x5455x"}
    ],
    "strumming_advice": "Shuffle feel on beats 2 and 4."
  },
  "lead_section": {
    "primary_scale": {
      "name": "A Minor Pentatonic",
      "root_fret": 5
    },
    "target_notes": [
      {"chord": "D9", "note": "F#", "advice": "Highlight the major 3rd."}
    ],
    "vocabulary_licks": [
      {
        "difficulty": "Easy",
        "description": "Albert King style double-stop bend.",
        "alphatex": "\\track 'Lead' \\staff { 5.2.4 5.1.4 | 7.3.2{b} | }"
      }
      // Must contain exactly 3 objects (Easy, Medium, Hard)
    ]
  }
}
```

---

## **6\. Prompt Engineering & AI Instructions**

When writing the Cloud Function that calls the Gemini API, the agent must implement this specific system prompt and enforce the schema defined in Section 5\.

**System Prompt String:**

"You are an expert guitar instructor and music theorist. Analyze the provided YouTube backing track metadata (Title and Description) and the user's skill level. Generate a comprehensive, highly accurate practice guide.

Strict Rules:

1. Output EXACTLY matching the provided JSON schema.  
2. The 'vocabulary\_licks' array must contain exactly 3 licks (Easy, Medium, Hard).  
3. The licks MUST be written in strict AlphaTex syntax. Do not use ASCII tablature.  
4. Ensure the AlphaTex licks mathematically fit a standard time signature and stylistically match the genre of the backing track."

*Handling "Generate New Licks" Button:*  
When the user clicks this, do NOT regenerate the whole document. Send a smaller prompt containing the track's Key/Genre and ask specifically for: *"Output a JSON array of 3 new vocabulary licks in AlphaTex format for this backing track."* Update the UI state, but do *not* overwrite the master `Backing_Tracks` cached document in Firestore.


# AI Agent Instructions for JamTheory

This file is the **primary entry-point for AI coding agents** (OpenCode, Cursor,
Copilot, etc.) operating in this repository. When asked to build or modify
features, you MUST adhere to the rules below.

---

## 1. Product context — read first

JamTheory implements **"The Silent Supervisor" Guitar Coach**, a data-driven,
AI-orchestrated practice environment for intermediate guitarists. The
full product specification — including scope boundaries, UI layout, data
model, and prompt engineering — lives in `jam_feature.md`.

> ⚠️ **Scope.** The strict scope of the current iteration and the full
> long-term product vision are both defined in `jam_feature.md`. Treat that
> document as the source of truth for *what to build*. Use this file
> (`AGENTS.md`) as the source of truth for *how to build it*.

**Always consult before structural or data changes:**
- `jam_feature.md` — product spec
- `docs/ARCHITECTURE.md` — system components and data flow
- `docs/DATA_MODEL.md` — exact Firestore schema
- `docs/SECURITY_AND_INFRA.md` — rules, IAM, and deployment
- `docs/ROADMAP.md` — planned future iterations (do not implement unprompted)

---

## 2. Architecture at a glance

JamTheory is a three-part application:

| Part | Path | Tech |
|------|------|------|
| **Frontend** | `frontend/` | React 18 + Vite + TypeScript + Tailwind + Firebase Web SDK |
| **Backend**  | `backend/`  | Python 3.11+ / FastAPI (local dev) + Google Cloud Functions 2nd gen (prod), behind API Gateway |
| **Infra**    | `infra/`    | Terraform (GCS state, europe-west1) |
| **Shared**   | `shared/`   | Cross-cut JSON schemas (single source of truth for the masterclass payload) |

Two Cloud Functions exist:
- `generate_masterclass_fn` — full YouTube → Gemini → structured masterclass
- `regenerate_licks_fn` — regenerate only the 3 vocabulary licks

Local development uses the Firebase Emulator Suite (Auth + Firestore).
Production uses real Firestore, behind API Gateway + Firebase JWT validation.

---

## 3. Global rules

- **No assumptions.** Always read `package.json`, `pyproject.toml`, or
  `requirements.txt` before invoking a command or adding a dependency.
- **Absolute paths.** When using file tools, use absolute paths starting from
  `/home/bartlbalazs/git/JamTheory/...`.
- **Data model integrity.** Never invent Firestore collections, subcollections,
  or document fields. Use exactly what is in `docs/DATA_MODEL.md`.
- **KISS.** This is an MVP. Do not add Redux/Zustand/NgRx, monorepo tooling,
  GraphQL, or microservices unless explicitly requested.
- **No destructive commands without explicit instruction** — no
  `rm -rf`, `git reset --hard`, `terraform destroy`, `gcloud ... delete`.
- **Commit only when asked.** Never `git commit` unless the user requests it.

---

## 4. Frontend (React + Vite) rules

### Tech stack
- React 18, TypeScript (strict), Vite
- Firebase Web SDK v10+ (modular imports only — never the compat SDK)
- TailwindCSS for styling (no custom CSS unless a library requires it)
- `@coderline/alphatab` for rendering AlphaTex licks (lazy-loaded)
- `react-youtube` or a plain `<iframe>` for the YouTube player

### Patterns
- **Components:** functional components + hooks only. No class components.
- **State:** local `useState` / `useReducer`. No global state library.
  If cross-component state is truly required, start with React Context.
- **Firebase services:** isolate all Firebase calls (Auth, Firestore) behind
  thin modules in `src/services/*.ts`. Components never import from
  `firebase/*` directly.
- **Backend calls:** use raw `fetch()` with the Firebase Callable wire
  protocol — request body `{"data": {...}}`, response `{"result": {...}}`
  or `{"error": {...}}`. Do **not** use `firebase/functions` SDK. URLs come
  from `src/env.ts` / `environment.prod.ts`.
- **AlphaTab:** always lazy-load via dynamic `import('@coderline/alphatab')`
  inside the renderer component. Never import at module top-level.
- **Desktop-first:** the spec mandates a single-screen desktop dashboard.
  Use a two-column Tailwind grid. Do not spend time on mobile responsiveness
  in iteration 1.
- **Templates:** keep JSX expressions simple. Compute values in the component
  body, not in JSX.

### Commands
- *Dev server*: `cd frontend && npm run dev`
- *Build*:      `cd frontend && npm run build`
- *Lint*:       `cd frontend && npm run lint`
- *Tests*:      `cd frontend && npm run test` (Vitest)

---

## 5. Backend (FastAPI / Cloud Functions) rules

### Tech stack
- Python 3.11+
- FastAPI (local dev server, not deployed)
- Google Cloud Functions 2nd gen (production, via `functions-framework`)
- Firebase Admin SDK (token verification, Firestore)
- Vertex AI Gemini (`google-genai` / `google-cloud-aiplatform`) with
  `response_schema` for strict JSON outputs
- YouTube Data API v3 (`google-api-python-client`) for metadata scraping
- `uv` for dependency management

### Patterns
- **Typing:** strict type hints everywhere. Pydantic v2 models mirror every
  Firestore document shape in `models/`.
- **File structure:**
  - `main.py` — FastAPI dev server (**not deployed**)
  - `fn_generate_masterclass.py` — Cloud Function entry point
  - `fn_regenerate_licks.py` — Cloud Function entry point
  - `callable_helpers.py` — Callable wire-protocol helpers
  - `log_setup.py` — structured Cloud Logging setup
  - `models/` — Pydantic schemas
  - `services/` — business logic (youtube, chord parser, gemini client)
  - `prompts/` — system prompt strings only, no logic
  - `tests/` — pytest
- **Errors:** use `callable_error("INVALID_ARGUMENT", msg, 400)` — never raise
  bare `Exception`. Catch specific exceptions; always log at `warning` or
  `exception` before returning.
- **Gemini:** always pass `response_schema` (Pydantic → JSON Schema). Never
  accept free-form text back into a structured field.
- **Secrets:** read from environment variables mounted by Terraform via
  Secret Manager. Never hardcode keys.
- **Firebase Admin:** initialise once per cold start (see pattern in
  `fn_generate_masterclass.py`).

### Commands
- *Dev server*: `cd backend && uv run uvicorn main:app --reload --port 8000`
- *Lint*:       `cd backend && uv run ruff check .`
- *Format*:     `cd backend && uv run ruff format .`
- *Tests*:      `cd backend && uv run pytest`
- *Single test*: `cd backend && uv run pytest tests/test_file.py::test_name`

---

## 6. Infrastructure (Terraform) rules

- All cloud infrastructure is managed by **Terraform** in `infra/`.
  Never click in the GCP Console.
- Region: **europe-west1** (change via `var.region` only).
- State: remote GCS bucket `{project_id}-jamtheory-terraform-state`,
  created by `bootstrap.sh`.
- Two service accounts:
  - `api-gateway-sa` — holds `roles/run.invoker`
  - `cf-runtime-sa`  — holds `roles/aiplatform.user`, `roles/datastore.user`,
    `roles/firebase.sdkAdminServiceAgent`, `roles/secretmanager.secretAccessor`,
    `roles/storage.objectViewer`
- YouTube Data API key lives in **Secret Manager**, injected into Cloud
  Functions via `secret_environment_variables`.

### Commands
- *First-time setup*: `./bootstrap.sh` (needs `PROJECT_ID` env var)
- *Full deploy*:      `./deploy.sh`
- *Infra only*:       `./deploy.sh --infra`
- *Hosting only*:     `./deploy.sh --hosting`

---

## 7. Local emulation

Run `./dev.sh` from the repo root. It starts:
1. Firebase Emulators (Auth on 9099, Firestore on 8081, UI on 4001)
2. FastAPI backend on `:8000`
3. Vite dev server on `:5173`

Pre-flight checks ensure `firebase`, `uv`, `npm` are installed and that
`backend/.env.local` exists.

---

## 8. Data model invariants (do not violate)

- Collection names are **lowercase with underscores**: `users`,
  `backing_tracks`, `practice_logs`. The spec uses PascalCase (`Users`,
  `Backing_Tracks`) — we deliberately deviate.
- `users/{uid}/practice_logs/{auto}` is a **subcollection**, not top-level.
- `backing_tracks/{videoId}` holds video-level metadata.
  Per-skill-level masterclass payloads live in the subcollection
  `backing_tracks/{videoId}/variants/{skillLevel}`.
- `vocabulary_licks` must contain **exactly 3 entries** — Easy, Medium, Hard.
- Licks are **AlphaTex strings only**. Never write or accept ASCII tablature.
- Firestore writes to `backing_tracks` are client-side and locked to
  create-only (no updates) — see `frontend/firestore.rules`.

---

## 9. Do / Don't

**Do**
- Read `jam_feature.md` before any feature work.
- Use Pydantic models as the single source of truth for backend shapes, and
  `shared/schemas/masterclass.schema.json` as the cross-cut reference.
- Cache Gemini outputs in `backing_tracks/{videoId}/variants/{skillLevel}`.
- Lazy-load AlphaTab to keep the initial bundle small.

**Don't**
- Don't add chatbot / conversational UI — the AI is strictly a background
  JSON generator.
- Don't attempt to sync diagrams to video playback timestamps.
- Don't send raw audio to the LLM. Metadata-only.
- Don't write ASCII tablature anywhere.
- Don't commit `.env*` files other than `.env.*.example` or
  `infra/terraform.tfvars` (secrets live there).
- `frontend/src/environments/environment.prod.ts` IS committed — it's a
  placeholder that `deploy.sh --hosting` overwrites with real values at
  deploy time. Do NOT put secrets in the placeholder.

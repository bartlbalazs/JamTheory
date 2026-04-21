<div align="center">

# JamTheory

**The Silent Supervisor — an AI-orchestrated practice environment for intermediate guitarists.**

</div>

---

JamTheory turns any YouTube backing track into a curated practice dashboard:
**key, genre, chord progression, target notes, and AI-generated AlphaTab licks**
at three difficulty levels — all derived from the video's title and description
without sending a single byte of audio to the LLM.

It is deliberately **not a chatbot**. The AI is a background data-parser that
emits strict JSON; the UI renders it into a distraction-free, single-screen
desktop dashboard.

---

## 🛠️ Tech stack

**Frontend**
- React 18 + Vite + TypeScript (strict)
- TailwindCSS
- Firebase Web SDK v10+ (modular)
- `@coderline/alphatab` for lick rendering (lazy-loaded)

**Backend**
- Python 3.11+ / FastAPI (local) · Google Cloud Functions 2nd gen (prod)
- Firebase Admin SDK
- Vertex AI Gemini with strict `response_schema`
- YouTube Data API v3

**Infrastructure**
- Terraform (GCS remote state, europe-west1)
- API Gateway + Firebase JWT validation
- Secret Manager for the YouTube API key
- Firebase Hosting

---

## 💻 Local development

Prerequisites: `firebase-tools`, `uv`, Node.js + npm, `terraform`, `gcloud`.

```bash
./dev.sh
```

This starts the Firebase Emulator Suite, the FastAPI backend (hot-reload),
and the Vite dev server in parallel. Default URLs:

| Service            | URL                          |
|--------------------|------------------------------|
| Frontend           | http://localhost:5173        |
| Backend API        | http://localhost:8000        |
| Backend API docs   | http://localhost:8000/docs   |
| Firebase Emulator  | http://localhost:4001        |

Stop everything with `Ctrl+C`.

---

## 🚀 Deployment

```bash
# One-time: create Terraform state bucket + run `terraform init`.
export PROJECT_ID=your-gcp-project-id
./bootstrap.sh

# Fill in your config
cp infra/terraform.tfvars.example infra/terraform.tfvars
# edit infra/terraform.tfvars

# Deploy
./deploy.sh             # infra + hosting
./deploy.sh --infra     # infrastructure only
./deploy.sh --hosting   # frontend + Firestore rules only
```

---

## 📚 Documentation

- [Product specification](jam_feature.md) — the master spec for every feature.
- [Architecture](docs/ARCHITECTURE.md) — components, data flows, deployment model.
- [Data model](docs/DATA_MODEL.md) — Firestore schema.
- [Security & infrastructure](docs/SECURITY_AND_INFRA.md) — rules, IAM, cost control.
- [Roadmap](docs/ROADMAP.md) — iterations 2-4 (deliberately out of scope today).
- [AI agent rules](AGENTS.md) — required reading for any AI coding assistant.

---

## ⚖️ License

MIT © 2026 The JamTheory Authors.

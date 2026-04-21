# JamTheory Security & Infrastructure

## 1. Firebase configuration

### 1.1 Authentication

- **Provider:** Google Sign-In via Firebase Auth.
- **Initial state:** new users are created with `status: "pending"` on first
  sign-in.
- **Admin action:** an administrator manually changes `status` to `"active"`
  via the Firebase Console (or an admin script) before the user can read
  chapters, write practice logs, or call the backend.

### 1.2 Firestore security rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isActiveUser() {
      return isAuthenticated()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == "active";
    }

    // Users document — owner read; self-create as "pending" only.
    // Status flip and all subsequent updates are done via the Firebase
    // Console or the Admin SDK (which bypasses rules).
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId
        && request.resource.data.status == "pending"
        && request.resource.data.skillLevel in ["Beginner", "Intermediate", "Advanced"];
      allow update: if request.auth.uid == userId
        // The user may update only their skillLevel and lastActive.
        && request.resource.data.status == resource.data.status
        && request.resource.data.email == resource.data.email
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(["skillLevel", "lastActive"]);
      allow delete: if false;

      // Practice logs — owner-only, append-only.
      match /practice_logs/{logId} {
        allow read: if request.auth.uid == userId && isActiveUser();
        allow create: if request.auth.uid == userId && isActiveUser()
          && request.resource.data.keys().hasAll(["youtubeVideoId", "date", "minutesPlayed"])
          && request.resource.data.minutesPlayed is int
          && request.resource.data.minutesPlayed >= 0;
        allow update, delete: if false;
      }
    }

    // Backing tracks — active users may create (for cache population), all
    // users may read. Updates and deletes are denied: the cache is immutable.
    match /backing_tracks/{videoId} {
      allow read: if isActiveUser();
      allow create: if isActiveUser()
        && request.resource.data.keys().hasAll(["youtubeUrl", "title", "description", "createdAt", "createdByUid"])
        && request.resource.data.createdByUid == request.auth.uid;
      allow update, delete: if false;

      match /variants/{skillLevel} {
        allow read: if isActiveUser();
        allow create: if isActiveUser()
          && skillLevel in ["Beginner", "Intermediate", "Advanced"]
          && request.resource.data.createdByUid == request.auth.uid
          && request.resource.data.keys().hasAll(["skillLevel", "trackInfo", "rhythmSection", "leadSection", "createdAt", "createdByUid"])
          // Enforce the "exactly 3 licks" invariant at the rule level.
          && request.resource.data.leadSection.vocabularyLicks.size() == 3;
        allow update, delete: if false;
      }
    }
  }
}
```

### 1.3 Trust model trade-off

The `backing_tracks/*` collections accept **client writes**. Any active user
can populate the global cache. This is acceptable because:

1. Writes are `create`-only (no mutation of existing documents).
2. Rules validate shape and required fields.
3. The spec requires an active-user admin approval step, so the set of
   writers is pre-vetted.

The weakness: a vetted user could still populate a variant with poor-quality
content. If this becomes a problem, migrate writes to a third Cloud
Function (`cache_masterclass_fn`) and flip the rule to `allow create: if false`.

---

## 2. Google Cloud infrastructure

All infrastructure is managed by Terraform in `infra/`. See `ARCHITECTURE.md`
for the deployment workflow.

### 2.1 Org policy constraint

This project operates under a GCP org policy that **denies unauthenticated
Cloud Function invocations**. API Gateway is therefore mandatory — it is the
public entry point that validates Firebase JWTs and invokes Cloud Functions
using a dedicated service account.

### 2.2 Security layering (defence-in-depth)

| Layer             | What it enforces                                                  |
|-------------------|-------------------------------------------------------------------|
| **API Gateway**   | Firebase JWT signature + issuer + audience validation at the edge. |
| **Cloud Run IAM** | `--no-allow-unauthenticated`; only `api-gateway-sa` can invoke.    |
| **Function code** | Re-verifies Firebase ID token; enforces business rules.            |

### 2.3 Service accounts

#### `api-gateway-sa`
- **Purpose:** used by API Gateway to invoke Cloud Functions.
- **Permissions:** `roles/run.invoker` (project-level — covers both functions).

#### `cf-runtime-sa`
- **Purpose:** attached to both Cloud Functions at runtime.
- **Permissions:**
  - `roles/aiplatform.user` — call Gemini models via Vertex AI.
  - `roles/datastore.user` — read Firestore (backend mostly stateless).
  - `roles/firebase.sdkAdminServiceAgent` — Firebase Admin SDK (token verify).
  - `roles/storage.objectViewer` — read CF source from GCS.
  - `roles/secretmanager.secretAccessor` — read the YouTube API key secret.

### 2.4 Secret Manager

| Secret              | Mounted as env var | Used by            |
|---------------------|--------------------|--------------------|
| `youtube-api-key`   | `YOUTUBE_API_KEY`  | `generate-masterclass` |

Rotation: bump the secret version and redeploy (`./deploy.sh --infra`).

### 2.5 API Gateway OpenAPI spec

`infra/openapi.yaml.tpl` is rendered with actual Cloud Function URLs at
`terraform apply` time. It configures:

- **Firebase JWT security:** `x-google-issuer`, `x-google-jwks_uri`,
  `x-google-audiences`.
- **Backend routing:** `x-google-backend` with `address` pointing to each
  function's Cloud Run URL.
- **CORS preflight:** separate `OPTIONS` path entries forwarded to the
  functions.
- **Quota:** per-project rate limits per endpoint (defence against runaway
  costs if a client key leaks).

### 2.6 GCS buckets

| Bucket                                      | Access        | Purpose                          |
|---------------------------------------------|---------------|----------------------------------|
| `{project_id}-cf-source`                    | Private       | Cloud Function source zips       |
| `{project_id}-jamtheory-terraform-state`    | Private       | Terraform remote state           |

JamTheory has **no public assets bucket** in iteration 1 (no images or
audio served from GCS). Add one if/when iteration 3 (Proof of Work webcam
recordings) lands.

### 2.7 Cloud Functions source zip

`./deploy.sh --infra` builds `infra/.build/backend.zip` from `backend/`,
excluding:
- `.venv/` — local virtualenv
- `tests/` — test files
- `__pycache__/` — bytecode
- `.python-version` — pyenv
- `main.py` — FastAPI dev server (not deployed)
- `.env*` — local env files
- `.ruff_cache/` — lint cache

---

## 3. Cost control

Vertex AI is the dominant cost driver. Recommended controls:

1. **Budget alert:** GCP Console → Billing → Budgets & alerts. Set a
   monthly budget (e.g. $20) with alerts at 50 / 90 / 100 %.
2. **Gateway quotas:** the OpenAPI template caps requests per minute per
   endpoint — a single leaked token can't run up a bill.
3. **Cache aggressively:** a cache hit in `backing_tracks/{videoId}/variants/{skillLevel}`
   costs zero LLM tokens.
4. **Regenerate-licks is NOT cached** on purpose — users expect different
   licks each time. Rate-limit it harder if cost becomes a problem.

> Billing budgets are intentionally **not** managed by Terraform to avoid
> accidental removal.

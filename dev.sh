#!/bin/bash
# dev.sh — Starts the full local development environment for JamTheory.
#
# Three processes in parallel:
#   1. Firebase Emulator Suite  (Auth on 9099, Firestore on 8081, UI on 4001)
#   2. FastAPI backend          (uvicorn --reload on :8000)
#   3. Vite frontend            (:5173)
#
# Prerequisites:
#   - firebase CLI    (npm install -g firebase-tools)
#   - uv              (https://github.com/astral-sh/uv)
#   - Node / npm
#   - backend/.env.local exists (copy from backend/.env.local.example)
#
# Usage:
#   ./dev.sh               # hot reload enabled (default)
#   ./dev.sh --no-reload   # disable hot reload
#
# Stop everything with Ctrl+C.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------
HOT_RELOAD=true
for arg in "$@"; do
  case "$arg" in
    --no-reload) HOT_RELOAD=false ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[dev]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev]${NC} $*"; }
error() { echo -e "${RED}[dev]${NC} $*"; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
log "Running pre-flight checks…"

if ! command -v firebase &>/dev/null; then
  error "firebase CLI not found. Run: npm install -g firebase-tools"; exit 1
fi
if ! command -v uv &>/dev/null; then
  error "uv not found. Install from: https://github.com/astral-sh/uv"; exit 1
fi
if ! command -v npm &>/dev/null; then
  error "npm not found. Install Node.js first."; exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env.local" ]]; then
  warn "backend/.env.local not found."
  warn "Copying from backend/.env.local.example — please fill in real values."
  cp "$BACKEND_DIR/.env.local.example" "$BACKEND_DIR/.env.local"
fi

log "All checks passed."
echo ""

# ---------------------------------------------------------------------------
# Dependency installation (only if needed)
# ---------------------------------------------------------------------------
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "Frontend node_modules missing — running npm install…"
  (cd "$FRONTEND_DIR" && npm install)
fi
if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  log "Backend .venv missing — running uv sync…"
  (cd "$BACKEND_DIR" && uv sync)
fi
echo ""

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------
PIDS=()
cleanup() {
  echo ""
  log "Shutting down all processes…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  log "Done."
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# 1. Firebase Emulator Suite
# ---------------------------------------------------------------------------
log "${CYAN}Starting Firebase Emulator Suite…${NC}"
firebase emulators:start \
  --only auth,firestore \
  --import="$FRONTEND_DIR/.firebase-emulator-data" \
  --export-on-exit \
  --project=demo-jamtheory \
  --config="$FRONTEND_DIR/firebase.json" &
PIDS+=($!)

log "Waiting for emulators to be ready…"
sleep 5

# ---------------------------------------------------------------------------
# 2. FastAPI backend
# ---------------------------------------------------------------------------
log "${CYAN}Starting FastAPI backend on http://localhost:8000…${NC}"
(
  cd "$BACKEND_DIR"
  # shellcheck disable=SC1091
  set -a; source .env.local; set +a
  if [[ "$HOT_RELOAD" == true ]]; then
    uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
  else
    uv run uvicorn main:app --host 0.0.0.0 --port 8000
  fi
) &
PIDS+=($!)

# ---------------------------------------------------------------------------
# 3. Vite frontend
# ---------------------------------------------------------------------------
log "${CYAN}Starting Vite frontend on http://localhost:5173…${NC}"
(
  cd "$FRONTEND_DIR"
  if [[ "$HOT_RELOAD" == true ]]; then
    npm run dev
  else
    npm run dev -- --no-hmr
  fi
) &
PIDS+=($!)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  JamTheory local environment is running  ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "  Frontend:          ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend API:       ${CYAN}http://localhost:8000${NC}"
echo -e "  Backend API docs:  ${CYAN}http://localhost:8000/docs${NC}"
echo -e "  Firebase Emulator: ${CYAN}http://localhost:4001${NC}"
if [[ "$HOT_RELOAD" == true ]]; then
  echo -e "  Hot reload:        ${GREEN}enabled${NC}"
else
  echo -e "  Hot reload:        ${YELLOW}disabled${NC}"
fi
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop everything."
echo ""

wait

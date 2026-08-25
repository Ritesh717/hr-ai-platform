#!/usr/bin/env bash
# Brings up everything the e2e suite needs (Mongo, Redis, backend, frontend, seeded tenant),
# then runs the full Playwright suite in apps/web/e2e/.
#
# Usage:
#   scripts/run-e2e.sh              # start what's missing, seed if needed, run all tests
#   scripts/run-e2e.sh <playwright-args...>   # forwarded to `npx playwright test`, e.g.:
#     scripts/run-e2e.sh e2e/leave.spec.ts
#     scripts/run-e2e.sh --ui
#     scripts/run-e2e.sh --workers=3
#   scripts/run-e2e.sh --fresh      # wipe the local Mongo data dir and reseed before running
#   scripts/run-e2e.sh --stop       # stop mongod/backend/frontend started by this script and exit
#
# Everything this script starts is idempotent — safe to re-run; it reuses whatever's already
# listening on the expected ports instead of starting a second copy.
#
# See apps/web/e2e/README.md for the env vars (E2E_TENANT_SLUG, E2E_ADMIN_EMAIL, ...) if you want
# to point this at a different seeded tenant than the default.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"
STATE_DIR="$ROOT_DIR/.local"
LOG_DIR="$STATE_DIR/logs"
MONGO_DATA_DIR="$STATE_DIR/mongo-data"
MONGO_PORT="${MONGO_PORT:-27018}"
API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-3000}"
MONGOD_PATH="${MONGOD_PATH:-C:/Program Files/MongoDB/Server/7.0/bin/mongod.exe}"

TENANT_SLUG="${E2E_TENANT_SLUG:-globex}"
ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-admin@globex.com}"
SEED_PASSWORD="${E2E_SEED_PASSWORD:-DemoPassw0rd!2026}"

mkdir -p "$LOG_DIR" "$MONGO_DATA_DIR"

log() { echo "[run-e2e] $*"; }

port_listening() {
  # Usage: port_listening <port>  → exit 0 if something is listening, 1 otherwise.
  powershell -NoProfile -Command \
    "if (Get-NetTCPConnection -LocalPort $1 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
}

wait_for_port() {
  # Usage: wait_for_port <port> <label> <timeout_seconds>
  local port="$1" label="$2" timeout="${3:-60}"
  local waited=0
  until port_listening "$port"; do
    if [ "$waited" -ge "$timeout" ]; then
      echo "[run-e2e] Timed out waiting for $label on port $port after ${timeout}s. Check $LOG_DIR/." >&2
      exit 1
    fi
    sleep 2
    waited=$((waited + 2))
  done
  log "$label is up on port $port."
}

wait_for_http() {
  # Usage: wait_for_http <url> <label> <timeout_seconds>
  local url="$1" label="$2" timeout="${3:-60}"
  local waited=0
  until curl -sf -o /dev/null "$url" 2>/dev/null; do
    if [ "$waited" -ge "$timeout" ]; then
      echo "[run-e2e] Timed out waiting for $label at $url after ${timeout}s. Check $LOG_DIR/." >&2
      exit 1
    fi
    sleep 2
    waited=$((waited + 2))
  done
  log "$label is responding at $url."
}

stop_all() {
  log "Stopping anything listening on $MONGO_PORT / $API_PORT / $WEB_PORT..."
  for port in "$MONGO_PORT" "$API_PORT" "$WEB_PORT"; do
    pid=$(powershell -NoProfile -Command \
      "(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)" \
      2>/dev/null | tr -d '\r')
    if [ -n "${pid:-}" ]; then
      log "Killing PID $pid (port $port)"
      powershell -NoProfile -Command "Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue" || true
    fi
  done
  log "Done. (Redis/docker is left running — stop it yourself with 'docker compose down' if you want it down too.)"
}

if [ "${1:-}" = "--stop" ]; then
  stop_all
  exit 0
fi

FRESH=0
PLAYWRIGHT_ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--fresh" ]; then
    FRESH=1
  else
    PLAYWRIGHT_ARGS+=("$arg")
  fi
done

# ── 1. Redis (docker) ──────────────────────────────────────────────────────────
if ! port_listening 6379; then
  log "Starting Redis via docker compose..."
  (cd "$ROOT_DIR" && docker compose up -d redis)
  wait_for_port 6379 Redis 30
else
  log "Redis already listening on 6379."
fi

# ── 2. MongoDB (native mongod, single-node replica set) ────────────────────────
if [ "$FRESH" = "1" ] && port_listening "$MONGO_PORT"; then
  log "--fresh requested: stopping existing mongod on $MONGO_PORT first..."
  pid=$(powershell -NoProfile -Command \
    "(Get-NetTCPConnection -LocalPort $MONGO_PORT -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)" \
    2>/dev/null | tr -d '\r')
  [ -n "${pid:-}" ] && powershell -NoProfile -Command "Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue" || true
  sleep 2
fi

if [ "$FRESH" = "1" ]; then
  log "--fresh requested: wiping $MONGO_DATA_DIR"
  rm -rf "${MONGO_DATA_DIR:?}"/*
fi

if ! port_listening "$MONGO_PORT"; then
  log "Starting mongod (replSet rs0) on port $MONGO_PORT..."
  if [ ! -f "$MONGOD_PATH" ]; then
    echo "[run-e2e] mongod not found at $MONGOD_PATH — set MONGOD_PATH to your mongod.exe." >&2
    exit 1
  fi
  ("$MONGOD_PATH" --replSet rs0 --port "$MONGO_PORT" --dbpath "$MONGO_DATA_DIR" \
    --bind_ip 127.0.0.1 --logpath "$LOG_DIR/mongod.log" &)
  wait_for_port "$MONGO_PORT" mongod 30

  log "Initiating replica set (first run only)..."
  node -e "
    const { MongoClient } = require('$API_DIR/node_modules/mongodb');
    (async () => {
      const client = new MongoClient('mongodb://127.0.0.1:$MONGO_PORT/?directConnection=true');
      await client.connect();
      const admin = client.db('admin');
      try {
        await admin.command({ replSetGetStatus: 1 });
        console.log('[run-e2e] replica set already initiated.');
      } catch {
        await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:$MONGO_PORT' }] } });
        console.log('[run-e2e] replica set initiated.');
      }
      await client.close();
    })().catch((e) => { console.error(e.message); process.exit(1); });
  "
else
  log "mongod already listening on $MONGO_PORT."
fi

# ── 3. Backend (apps/api) ───────────────────────────────────────────────────────
if ! port_listening "$API_PORT"; then
  log "Starting backend (npm run start:dev) — logging to $LOG_DIR/api.log ..."
  (cd "$API_DIR" && (npm run start:dev > "$LOG_DIR/api.log" 2>&1 &))
  # A cold `nest start --watch` TypeScript compile alone can take ~90-100s before Nest even
  # starts bootstrapping — give it real headroom rather than a tight timeout.
  wait_for_http "http://localhost:$API_PORT" backend 180
else
  log "Backend already listening on $API_PORT."
fi

# ── 4. Frontend (apps/web) ──────────────────────────────────────────────────────
if ! port_listening "$WEB_PORT"; then
  log "Starting frontend (npm run dev) — logging to $LOG_DIR/web.log ..."
  (cd "$WEB_DIR" && (npm run dev > "$LOG_DIR/web.log" 2>&1 &))
  wait_for_http "http://localhost:$WEB_PORT" frontend 120
else
  log "Frontend already listening on $WEB_PORT."
fi

# ── 5. Seed a tenant if the target one doesn't exist yet ───────────────────────
log "Checking for tenant '$TENANT_SLUG'..."
login_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:$API_PORT/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"tenantSlug\":\"$TENANT_SLUG\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$SEED_PASSWORD\"}")

if [ "$login_status" = "200" ]; then
  log "Tenant '$TENANT_SLUG' already seeded."
else
  log "Seeding tenant '$TENANT_SLUG' (npm run seed-demo-org)..."
  (cd "$API_DIR" && npm run seed-demo-org -- --tenant-name "Globex Corporation" --tenant-slug "$TENANT_SLUG" --password "$SEED_PASSWORD")
fi

# ── 6. Run the suite ─────────────────────────────────────────────────────────────
# Default to a moderate worker count — a full-suite run at Playwright's default (one worker per
# CPU core) can throw 10 parallel navigations at the Next.js dev server at once, which has been
# observed to push a Fast Refresh recompile out past a minute and time out unrelated tests. Only
# applied if the caller didn't already pass their own --workers.
has_workers_flag=0
for a in "${PLAYWRIGHT_ARGS[@]:-}"; do
  case "$a" in --workers*) has_workers_flag=1 ;; esac
done
if [ "$has_workers_flag" = "0" ]; then
  PLAYWRIGHT_ARGS+=("--workers=4")
fi

log "Running Playwright e2e suite..."
cd "$WEB_DIR"
npx playwright test "${PLAYWRIGHT_ARGS[@]}"

#!/usr/bin/env bash
# Start the local app: deps if missing, migrate, backend + frontend.
# Usage (from repo root):  ./.pouya-stuff/start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.pouya-stuff/run"
LOG_DIR="$ROOT/.pouya-stuff/logs"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
NODE_VERSION="20.19.1"

mkdir -p "$RUN_DIR" "$LOG_DIR"

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
    sleep 0.4
    pids="$(lsof -ti:"$port" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

wait_port() {
  local port="$1"
  local name="$2"
  local i
  for i in $(seq 1 60); do
    if (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
      return 0
    fi
    sleep 0.25
  done
  echo "ERROR: $name did not start on port $port"
  echo "  See $LOG_DIR/"
  return 1
}

load_node() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # nvm is a shell function; disable nounset while sourcing it
    set +u
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    nvm use "$NODE_VERSION" >/dev/null
    set -u
  fi
  if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm/node not found. Install Node $NODE_VERSION (nvm is fine)."
    exit 1
  fi
}

load_backend_env() {
  if [[ -f "$BACKEND/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$BACKEND/.env"
    set +a
  fi
  export POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
  export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
}

echo "Stopping anything already on :8000 and :5173..."
kill_port 8000
kill_port 5173

echo "Starting Postgres (make db) and stopping Docker app containers if they are up..."
(cd "$ROOT" && make db)
if command -v docker >/dev/null 2>&1; then
  (cd "$ROOT" && docker compose stop backend frontend nginx >/dev/null 2>&1) || true
fi
load_backend_env
find "$BACKEND/core" -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true

if [[ ! -d "$BACKEND/.venv" ]]; then
  echo "Creating backend virtualenv..."
  python3 -m venv "$BACKEND/.venv"
fi

# shellcheck disable=SC1091
. "$BACKEND/.venv/bin/activate"

if [[ ! -x "$BACKEND/.venv/bin/daphne" ]]; then
  echo "Installing backend packages..."
  pip install -r "$BACKEND/requirements.txt"
fi

if [[ ! -f "$BACKEND/.env" ]]; then
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo "Created backend/.env from example."
fi

if [[ ! -f "$FRONTEND/.env" ]]; then
  cp "$FRONTEND/.env.example" "$FRONTEND/.env"
  echo "Created frontend/.env from example."
fi

load_node

if [[ ! -x "$FRONTEND/node_modules/.bin/vite" ]]; then
  echo "Installing frontend packages..."
  (cd "$FRONTEND" && npm install)
fi

echo "Migrating database..."
(
  cd "$BACKEND"
  load_backend_env
  python manage.py migrate --noinput
)
(
  cd "$BACKEND"
  load_backend_env
  python manage.py seed_eval
)

echo "Starting backend (Daphne) on 127.0.0.1:8000..."
(
  cd "$BACKEND"
  load_backend_env
  # shellcheck disable=SC1091
  . .venv/bin/activate
  exec daphne -b 127.0.0.1 -p 8000 core.asgi:application
) >"$LOG_DIR/backend.log" 2>&1 &
echo $! >"$RUN_DIR/backend.pid"

echo "Starting frontend (Vite) on 127.0.0.1:5173..."
(
  load_node
  cd "$FRONTEND"
  # Bind localhost only so CORS always matches (ignore Vite Network URL).
  exec npx vite --host 127.0.0.1 --port 5173
) >"$LOG_DIR/frontend.log" 2>&1 &
echo $! >"$RUN_DIR/frontend.pid"

wait_port 8000 "backend"
wait_port 5173 "frontend"

cat <<EOF

Ready.

  Open:     http://localhost:5173
  Backend:  http://127.0.0.1:8000
  Docs:     http://127.0.0.1:8000/api/docs/
  Postgres: localhost:5432 (docker)

  Login with EMAIL (not username):
    alex@example.com       testpass123
    carlito@example.com    12345678

  Stop:     $ROOT/.pouya-stuff/stop.sh
  Logs:     $LOG_DIR/

EOF

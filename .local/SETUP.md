# Local setup guide (personal — not pushed to git)

Use this file every time you clone the repo, set up on a new machine, or **switch branches**.

---

## Prerequisites

Install once on your machine:

- **Python** 3.10+ (you have 3.12)
- **Node.js** 18+ and **npm**
- **Git**

No Docker or PostgreSQL needed for local dev (SQLite is used by default).

---

## First-time setup (once per machine)

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .\.venv\Scripts\Activate.ps1     # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Create local env file (only if .env does not exist)
cp .env.example .env

# Apply database migrations
python manage.py migrate
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create local env file (only if .env does not exist)
cp .env.example .env
```

### 3. Optional

```bash
# Django admin user
cd backend && source .venv/bin/activate
python manage.py createsuperuser
```

---

## Run the project (every day)

Open **two terminals**:

### Terminal 1 — Backend (use Daphne for WebSocket chat)

```bash
cd backend
source .venv/bin/activate
daphne -b 127.0.0.1 -p 8000 core.asgi:application
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

### URLs

| Service        | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:5173            |
| Backend API    | http://127.0.0.1:8000            |
| Swagger docs   | http://127.0.0.1:8000/api/docs/  |
| Django admin   | http://127.0.0.1:8000/admin/     |

> Use port **5173** for the frontend — CORS is configured for that port.

---

## After switching git branches

Do this **every time** you change branch (`git checkout`, `git switch`, etc.).

### Step 1 — Stop running servers

Press `Ctrl+C` in both terminal windows (backend + frontend).

Or kill processes on the ports:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
```

### Step 2 — Switch branch

```bash
git fetch origin
git switch <branch-name>
# example: git switch feature/discover-page
```

### Step 3 — Update dependencies (only if files changed)

Check if `requirements.txt` or `package.json` changed on the new branch:

```bash
# Backend — run if requirements.txt changed
cd backend && source .venv/bin/activate
pip install -r requirements.txt

# Frontend — run if package.json changed
cd frontend
npm install
```

### Step 4 — Update database (only if backend migrations changed)

```bash
cd backend && source .venv/bin/activate
python manage.py migrate
```

> Note: `db.sqlite3` is tracked in git. Switching branches may replace it with that branch's database.

### Step 5 — Restart servers

Start backend and frontend again (see **Run the project** above).

### Step 6 — Hard refresh browser

Press `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux) to avoid stale frontend cache.

---

## Quick checklist (branch switch)

- [ ] Stop backend and frontend
- [ ] `git switch <branch>`
- [ ] `pip install -r requirements.txt` (if backend deps changed)
- [ ] `npm install` (if frontend deps changed)
- [ ] `python manage.py migrate` (if migrations changed)
- [ ] Start Daphne backend
- [ ] Start Vite frontend
- [ ] Open http://localhost:5173

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Port 8000 already in use` | `lsof -ti:8000 \| xargs kill -9` |
| `Port 5173 already in use` | `lsof -ti:5173 \| xargs kill -9` |
| Frontend can't reach API | Check `frontend/.env` has `VITE_API_URL=http://127.0.0.1:8000` |
| WebSocket chat not working | Use **Daphne**, not `runserver` |
| CORS errors | Frontend must run on port **5173** |
| Module not found (Python) | `source .venv/bin/activate` then `pip install -r requirements.txt` |
| Module not found (Node) | `cd frontend && npm install` |

---

## What stays local (never pushed)

These files/folders are only on your machine:

- `.local/` — this guide and your personal notes
- `backend/.env` — secrets and local config
- `frontend/.env` — API URLs
- `backend/.venv/` — Python packages
- `frontend/node_modules/` — npm packages
- `frontend/.vite/` — Vite cache

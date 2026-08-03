# Local setup guide (personal)

Use this every day to start the app, and after `git pull` / branch switches.

---

## Prerequisites (once per machine)

- **Python** 3.10+ (you have 3.12)
- **Node.js** 18+ and **npm**
- **Git**

No Docker or PostgreSQL for local dev (SQLite by default).

---

## First-time setup (once per machine)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # only if .env does not exist
python manage.py migrate
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # only if .env does not exist
```

### 3. Optional admin user

```bash
cd backend && source .venv/bin/activate
python manage.py createsuperuser
```

---

## Daily start (do this every day)

Always migrate **before** starting the backend. New tables (like Groups) break the UI if you skip this.

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate
python manage.py migrate
daphne -b 127.0.0.1 -p 8000 core.asgi:application
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

### Open

| Service       | URL                             |
|---------------|---------------------------------|
| Frontend      | http://localhost:5173           |
| Backend API   | http://127.0.0.1:8000           |
| Swagger docs  | http://127.0.0.1:8000/api/docs/ |
| Django admin  | http://127.0.0.1:8000/admin/    |

> Frontend must stay on port **5173** (CORS).

---

## Daily checklist

- [ ] `cd backend && source .venv/bin/activate`
- [ ] `python manage.py migrate`
- [ ] Start Daphne: `daphne -b 127.0.0.1 -p 8000 core.asgi:application`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Open http://localhost:5173
- [ ] Hard refresh if UI looks stale: `Cmd+Shift+R`

---

## After `git pull` or switching branches

Do this whenever you update code (`git pull`, `git switch`, merge, etc.).

### 1. Stop servers

`Ctrl+C` in both terminals, or:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
```

### 2. Update code

```bash
git fetch origin
git switch main          # or another branch
git pull
```

### 3. Refresh deps (if needed)

```bash
# Backend — if requirements.txt changed
cd backend && source .venv/bin/activate
pip install -r requirements.txt

# Frontend — if package.json changed
cd frontend
npm install
```

### 4. Migrate DB (always safe to run)

```bash
cd backend && source .venv/bin/activate
python manage.py migrate
```

### 5. Restart servers

Use **Daily start** above.

### 6. Hard refresh browser

`Cmd+Shift+R` (macOS) / `Ctrl+Shift+R` (Windows/Linux).

---

## Quick “I just pulled main” recipe

```bash
# stop old servers first (Ctrl+C), then:
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 127.0.0.1 -p 8000 core.asgi:application

# other terminal:
cd frontend
npm install
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Groups page shows raw HTML / `OperationalError` / `no such table: groups_group` | Run `python manage.py migrate` then reload |
| `Port 8000 already in use` | `lsof -ti:8000 \| xargs kill -9` |
| `Port 5173 already in use` | `lsof -ti:5173 \| xargs kill -9` |
| Frontend can't reach API | Check `frontend/.env` → `VITE_API_URL=http://127.0.0.1:8000` |
| WebSocket chat broken | Use **Daphne**, not `runserver` |
| CORS errors | Frontend must be on port **5173** |
| Python module missing | `source .venv/bin/activate` then `pip install -r requirements.txt` |
| Node module missing | `cd frontend && npm install` |
| UI looks old after branch/pull | Hard refresh `Cmd+Shift+R` |

Check pending migrations anytime:

```bash
cd backend && source .venv/bin/activate
python manage.py showmigrations
```

`[ ]` = not applied yet → run `migrate`.

---

## What stays local (never commit)

- `.local/` — this guide and personal notes (backed up on `pouyas-stuff`)
- `backend/.env` / `frontend/.env`
- `backend/.venv/`
- `frontend/node_modules/`
- `frontend/.vite/`

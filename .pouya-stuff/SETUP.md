# Local setup guide (personal)

Use this every day to start the app, and after `git pull` / branch switches.

This file lives in `.pouya-stuff/` on `main`. Do not commit it.

**Daily start (preferred):** from the repo root, one command:

```bash
./.pouya-stuff/start.sh
```

That creates `.venv` / installs packages if they are missing, migrates, starts backend + frontend, and prints the login URL. Stop with:

```bash
./.pouya-stuff/stop.sh
```

On Ubuntu, the system command is **`python3`**, not `python`. After the venv is activated, `python` works because the venv provides it.

`.venv/` and `node_modules/` are gitignored. Switching to `main` does **not** create them. If daily start fails, run **First-time setup** first.

---

## Prerequisites (once per machine)

- **Python** 3.10+ (this machine: 3.12) — command is `python3`
- **Node.js** 20.19+ (or 22.12+) and **npm** (nvm is fine)
- **Git**
- **Docker** — `start.sh` runs `make db` so Postgres is available on `localhost:5432`

---

## First-time setup (once per clone / if `.venv` or `node_modules` is missing)

Run this after a fresh clone, or when you see:

- `bash: .venv/bin/activate: No such file or directory`
- `Command 'python' not found`
- `Command 'daphne' not found`
- `sh: 1: vite: not found`

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # only if .env does not exist
# from repo root: make db
python manage.py migrate
python manage.py seed_eval
```

### 2. Frontend

```bash
cd frontend
nvm use 20.19.1               # if Node is managed with nvm
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

From the repo root:

```bash
./.pouya-stuff/start.sh
```

Open **http://localhost:5173** and log in with `alex@example.com` / `testpass123`.

The script binds Vite to `127.0.0.1` on purpose. Do not use a Network/`10.x` URL — CORS will block login.

Stop:

```bash
./.pouya-stuff/stop.sh
```

If you already have servers running in other terminals, the script frees ports **8000** and **5173** first.

---

### Manual start (only if you do not want the script)

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
nvm use 20.19.1               # if Node is managed with nvm
npm run dev
```

### Open

Use the **Local** URL only. Vite also prints a **Network** URL (`http://10.x.x.x:5173`). Do not open that — CORS will block login (you will see `OPTIONS /api/auth/login/` in the backend, but no `POST`, and the button looks like it does nothing).

| Service       | URL                             |
|---------------|---------------------------------|
| Frontend      | http://localhost:5173           |
| Backend API   | http://127.0.0.1:8000           |
| Swagger docs  | http://127.0.0.1:8000/api/docs/ |
| Django admin  | http://127.0.0.1:8000/admin/    |

> Frontend must stay on port **5173** (CORS).

### Login (this changed on main)

Login is **email**, not username. Typing `alex` will not submit (browser email validation, no request).

| Email | Password |
|-------|----------|
| `alex@example.com` | `testpass123` |
| `carlito@example.com` | `12345678` |

---

## Daily checklist

- [ ] `./.pouya-stuff/start.sh`
- [ ] Open **http://localhost:5173**
- [ ] Log in with `alex@example.com` / `testpass123`
- [ ] Hard refresh if UI looks stale: `Ctrl+Shift+R`

---

## After `git pull` or switching branches

Do this whenever you update code (`git pull`, `git switch`, merge, etc.).

`.venv` and `node_modules` stay on disk across branch switches. You do **not** recreate them every time — only if they are missing, or if `requirements.txt` / `package.json` changed.

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

If `.venv` is missing, recreate it first (`python3 -m venv .venv`).

```bash
# Backend — if requirements.txt changed, or packages are missing
cd backend && source .venv/bin/activate
pip install -r requirements.txt

# Frontend — if package.json changed, or vite is missing
cd frontend
nvm use 20.19.1
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

`Ctrl+Shift+R` (Linux/Windows) / `Cmd+Shift+R` (macOS).

---

## Quick “I just pulled main” recipe

If `.venv` or `node_modules` is missing, run **First-time setup** instead.

```bash
# stop old servers first (Ctrl+C), then:
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 127.0.0.1 -p 8000 core.asgi:application

# other terminal:
cd frontend
nvm use 20.19.1
npm install
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `.venv/bin/activate: No such file` | `cd backend && python3 -m venv .venv` then `pip install -r requirements.txt` |
| `Command 'python' not found` | Use `python3`, or `source .venv/bin/activate` first |
| `Command 'daphne' not found` | Activate the venv, then `pip install -r requirements.txt`. Do not `apt install daphne` |
| `sh: 1: vite: not found` | `cd frontend && npm install` |
| Groups page shows raw HTML / `OperationalError` / `no such table: groups_group` | Run `python manage.py migrate` then reload |
| `Port 8000 already in use` | `lsof -ti:8000 \| xargs kill -9` |
| `Port 5173 already in use` | `lsof -ti:5173 \| xargs kill -9` |
| Login button does nothing | Use a real **email** (`alex@example.com`), not `alex`. Open `http://localhost:5173`, not the Network URL |
| Backend shows `OPTIONS /api/auth/login/` but no `POST` | You opened Vite's Network IP. Use `http://localhost:5173` and restart backend if you changed `.env` |
| Frontend can't reach API | Check `frontend/.env` → `VITE_API_URL=http://127.0.0.1:8000`, then restart `npm run dev` (Vite reads `.env` only at start) |
| WebSocket chat broken | Use **Daphne**, not `runserver` |
| CORS errors | Frontend must be `http://localhost:5173` or `http://127.0.0.1:5173` |
| Python module missing | `source .venv/bin/activate` then `pip install -r requirements.txt` |
| Node module missing | `cd frontend && npm install` |
| UI looks old after branch/pull | Hard refresh `Ctrl+Shift+R` |

Check pending migrations anytime:

```bash
cd backend && source .venv/bin/activate
python manage.py showmigrations
```

`[ ]` = not applied yet → run `migrate`.

---

## What stays local (never commit)

- `.pouya-stuff/` — this guide and personal notes
- `backend/.env` / `frontend/.env`
- `backend/.venv/`
- `frontend/node_modules/`
- `frontend/.vite/`

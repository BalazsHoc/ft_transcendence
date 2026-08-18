# DevOps

Mandatory container deployment for Active Vienna (`ft_transcendence`). This is not an extra DevOps module (no ELK, Prometheus, or microservices).

## Architecture

Three containers share a private Docker bridge network named `transcendence`. Only nginx is reachable from the host.

```text
Browser  --HTTPS 443 / HTTP 80 redirect-->  nginx (public)
                                              |
                                              |-- /              --> frontend:80  (SPA)
                                              |-- /api /admin /ws --> backend:8000 (Daphne)
                                              |-- /static         --> collected Django static files
                                              `-- /media          --> backend/media on the host
```

| Service | Role | Host ports | Main process |
| --- | --- | --- | --- |
| `nginx` | TLS terminator and reverse proxy | `80`, `443` | `nginx` (foreground) |
| `frontend` | Production React SPA | none | `nginx` (foreground) |
| `backend` | Django + Channels via Daphne | none | `daphne` |

SQLite is the database. It is the file `backend/db.sqlite3` in git, bind-mounted into the backend container. There is no database container.

Each service uses `init: true` (so signals are forwarded and zombies are reaped), `restart: unless-stopped`, and a healthcheck. Entry points `exec` the real process after setup so a crash exits the container instead of hanging.

Internal HTTP between containers is allowed by the subject. Browsers only talk HTTPS to nginx.

## Prerequisites

- Docker Engine
- Docker Compose v2 (`docker compose`) or Compose v1 (`docker-compose`)
- `make`
- Ubuntu is the evaluation target; any recent Docker install works
- Ports `80` and `443` free on the machine

## One-command start

From the repository root:

```bash
make
```

That is the eval command. It:

1. Copies `.env.example` to `.env` if `.env` is missing
2. Replaces the placeholder `SECRET_KEY` with a random value (keeps an existing real key)
3. Uses `docker compose` when available, otherwise `docker-compose`
4. Runs `up --build -d`

Everyday commands:

```bash
make          # start (same as make up)
make down     # stop containers; sqlite and media stay
make logs     # follow logs
make ps       # container status
make restart  # restart without rebuild
make re       # down, then up
make clean    # down and remove the generated static volume (not sqlite)
make help     # list targets
```

`./run.sh` still works; it just runs `make up`.

Open **https://localhost**. Chrome will warn about the self-signed certificate. Click through (Advanced → Proceed) once.

Useful URLs after the stack is up:

| URL | What |
| --- | --- |
| https://localhost/ | Application |
| https://localhost/api/docs/ | Swagger |
| https://localhost/admin/ | Django admin |
| http://localhost/ | Redirects to HTTPS |

## Environment

Root `.env` is gitignored. Start from `.env.example`. Compose injects HTTPS CORS/CSRF values for the containers. Local Vite/Daphne still use `backend/.env` and `frontend/.env` as before.

Do not commit `.env` or TLS private keys.

With `DEBUG=False` (Compose), Django also turns on secure cookies and `SECURE_CONTENT_TYPE_NOSNIFF`. It does **not** set `SECURE_SSL_REDIRECT`: nginx already redirects HTTP to HTTPS, and Daphne must keep answering plain HTTP on port 8000 for healthchecks and the proxy.

## What we deliberately skip

A typical “real production” write-up often adds PostgreSQL, Redis, backups, and a rollback runbook. Those are out of scope here:

| Suggestion | Why we do not do it |
| --- | --- |
| PostgreSQL | Switching would drop the current events, chats, and groups. The subject asks for a database, not a database container. `backend/db.sqlite3` stays in git so the team and eval share the same data. |
| Redis / `channels-redis` | Needed only if several Daphne workers share a channel layer. We run **one** backend replica, so `InMemoryChannelLayer` can fan out chat to every browser on that machine. |
| Postgres backups and deploy rollback | That is the extra DevOps “health check / backups / disaster recovery” module. We are not claiming those points. |
| Keep SQLite local-only | The team wants create-event → commit → pull so others see it. The sqlite file is the shared database. |

## Sharing data between developers

The live database is `backend/db.sqlite3`. It is tracked in git so events, chats, groups, and users stay with the project.

To share new data:

1. Stop the backend (local Daphne **or** `docker compose down`) so SQLite finishes writing
2. `git add backend/db.sqlite3` and any new files under `backend/media/`
3. Commit and push
4. Others `git pull` before they start

Two people changing the database at the same time can get a merge conflict on the sqlite file. Coordinate, or one side keeps their file and the other re-applies data.

Never run local Daphne and the Docker backend at the same time. Both would lock the same sqlite file.

`docker compose down` keeps the sqlite file (it lives in git, not a named volume). `docker compose down -v` only removes the generated `staticfiles` volume.

## Several users on one machine

Open as many browsers or profiles as you need (normal window, incognito, another Chrome profile, Firefox). Each profile has its own login. They all connect to the same Daphne process, so group/event/direct chat works across those sessions.

This stack is not meant for two laptops hitting one running instance over a LAN IP. On another PC, clone, run `./run.sh`, and open browsers there.

## Daily local development without Docker

SQLite + Vite is unchanged:

- Backend: `daphne -b 127.0.0.1 -p 8000 core.asgi:application`
- Frontend: `npm run dev` on port 5173 with `frontend/.env` pointing at `http://127.0.0.1:8000`

See [frontend/DEV.md](frontend/DEV.md) and [backend/README.md](backend/README.md).

## Common commands

```bash
make
make ps
make logs
make restart
make down
```

Compose v1 vs v2 is chosen automatically by the Makefile.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Port 80 or 443 already in use | Stop the other service, or see `ss -lntp \| grep -E ':80|:443'` |
| Browser certificate warning | Expected for the self-signed cert. Proceed to localhost. |
| Empty site after pull | Run `make` again so images rebuild. Hard-refresh the browser. |
| Missing tables | Backend entrypoint runs `migrate` on start. Check `make logs`. |
| Chat WebSocket fails | Use `https://localhost` (not HTTP, not `:5173` while Docker is up). |
| `db.sqlite3` merge conflict | Stop servers, pick one file, commit. Do not merge sqlite as text. |
| `make: command not found` | Install `make` (`sudo apt install make`) |

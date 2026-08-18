# DevOps

Mandatory container deployment for Active Vienna (`ft_transcendence`). This is not an extra DevOps module (no ELK, Prometheus, or microservices).

Architecture diagrams (containers, request path, data): [DOCKER.md](DOCKER.md).

## Architecture

Four containers share a private Docker bridge network named `transcendence`. Only nginx is reachable from the host during eval.

```text
Browser  --HTTPS 443 / HTTP 80 redirect-->  nginx (public)
                                              |
                                              |-- /              --> frontend:80  (SPA)
                                              |-- /api /admin /ws --> backend:8000 (Daphne)
                                              |-- /static         --> collected Django static files
                                              `-- /media          --> backend/media on the host

backend  -->  db:5432  (PostgreSQL, private)
```

| Service | Role | Host ports | Main process |
| --- | --- | --- | --- |
| `nginx` | TLS terminator and reverse proxy | `80`, `443` | `nginx` (foreground) |
| `frontend` | Production React SPA | none | `nginx` (foreground) |
| `backend` | Django + Channels via Daphne | none | `daphne` |
| `db` | PostgreSQL | none on eval; `5432` with `make db` | `postgres` |

Each service uses `init: true` (so signals are forwarded and zombies are reaped), `restart: unless-stopped`, and a healthcheck. Entry points `exec` the real process after setup so a crash exits the container instead of hanging.

Internal HTTP between containers is allowed by the subject. Browsers only talk HTTPS to nginx.

PostgreSQL is the only database. Several browsers on this PC are several WebSocket clients on **one** Daphne process. Redis is not required.

## Two ways to run it

| | Daily coding | Eval / `make` |
| --- | --- | --- |
| Database | `make db` (Postgres on `localhost:5432`) | Same image and `pgdata` volume |
| App | Local Daphne `:8000` + Vite `:5173` | nginx + frontend + backend containers |
| Browser | `http://localhost:5173` | `https://localhost` |

Do **not** run local Daphne and the Docker backend at the same time. They share the same database.

## One-command eval start

From the repository root:

```bash
make
```

That is the eval command. It:

1. Copies `.env.example` to `.env` if `.env` is missing
2. Replaces the placeholder `SECRET_KEY` with a random value (keeps an existing real key)
3. Uses `docker compose` when available, otherwise `docker-compose`
4. Runs `up --build -d`
5. Migrates and, if the database is empty, loads the committed snapshot

Everyday commands:

```bash
make          # eval stack (HTTPS)
make db       # Postgres only, for daily Daphne + Vite
make seed     # reset the database to the committed snapshot
make down     # stop containers; Postgres volume and media stay
make logs     # follow logs
make ps       # container status
make restart  # restart without rebuild
make re       # down, then up
make clean    # down and delete Postgres + static volumes
make help     # list targets
```

`./run.sh` still works; it just runs `make up`.

Open **https://localhost**. Chrome will warn about the self-signed certificate. Click through (Advanced → Proceed) once. WebSocket errors in the console before that are the cert, not the database.

Useful URLs after the eval stack is up:

| URL | What |
| --- | --- |
| https://localhost/ | Application |
| https://localhost/api/docs/ | Swagger |
| https://localhost/admin/ | Django admin |
| http://localhost/ | Redirects to HTTPS |

## Daily coding

```bash
make db
```

Then:

- Backend: `daphne -b 127.0.0.1 -p 8000 core.asgi:application` (from `backend/` with the venv)
- Frontend: `npm run dev` on port 5173 with `frontend/.env` pointing at `http://127.0.0.1:8000`

`backend/.env` must use `POSTGRES_HOST=127.0.0.1`. Compose overrides that to `db` inside the backend container.

See [frontend/DEV.md](frontend/DEV.md) and [backend/README.md](backend/README.md).

## Environment

Root `.env` is gitignored. Start from `.env.example`. Compose injects HTTPS CORS/CSRF values and `POSTGRES_HOST=db` for the backend container. Local Vite/Daphne use `backend/.env` and `frontend/.env`.

Do not commit `.env` or TLS private keys.

With `DEBUG=False` (Compose), Django also turns on secure cookies and `SECURE_CONTENT_TYPE_NOSNIFF`. It does **not** set `SECURE_SSL_REDIRECT`: nginx already redirects HTTP to HTTPS, and Daphne must keep answering plain HTTP on port 8000 for healthchecks and the proxy.

## Seed snapshot

The live database is PostgreSQL (`pgdata` volume). It is not in git.

A fresh empty volume is filled on backend start from [backend/fixtures/eval_snapshot.json](backend/fixtures/eval_snapshot.json) (users, groups, events, chats). Restarts keep existing rows. To restore the snapshot:

```bash
make seed
```

Known logins (email / password):

- `alex@example.com` / `testpass123`
- `carlito@example.com` / `12345678`

`make down` keeps `pgdata`. `make clean` (`down -v`) deletes it; the next `make` reseeds.

## Several users on one machine

Open as many browsers or profiles as you need (normal window, incognito, another Chrome profile, Firefox). Each profile has its own login. They all connect to the same Daphne process, so group/event/direct chat works across those sessions.

This stack is not meant for two laptops hitting one running instance over a LAN IP. On another PC, clone, run `make`, and open browsers there.

## What we deliberately skip

| Suggestion | Why we do not do it |
| --- | --- |
| Redis / `channels-redis` | Needed only if several Daphne workers share a channel layer. We run **one** backend replica. |
| Postgres backups and deploy rollback | Extra DevOps module. We are not claiming those points. |
| SQLite as a second engine | Same bugs should show locally and at eval. |

## Common commands

```bash
make
make db
make seed
make ps
make logs
make down
```

Compose v1 vs v2 is chosen automatically by the Makefile.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Port 80 or 443 already in use | Stop the other service, or see `ss -lntp \| grep -E ':80|:443'` |
| Port 5432 already in use | Stop the other Postgres, or `make down` if an old `make db` is still up |
| Browser certificate warning | Expected for the self-signed cert. Proceed to localhost. |
| Chat WebSocket fails on `https://localhost` | Accept the cert first, then reload. |
| Empty site after pull | Run `make` again so images rebuild. Hard-refresh the browser. |
| Missing tables / no demo users | Backend entrypoint migrates and seeds an empty database. Check `make logs`, or run `make seed`. |
| Local Daphne cannot connect | Run `make db`. `POSTGRES_HOST` must be `127.0.0.1` in `backend/.env`. |
| Local Daphne and Docker backend both running | Stop one of them. |
| `make: command not found` | Install `make` (`sudo apt install make`) |
| `permission denied` on `docker.sock` | Your user is not in the `docker` group. Run `sudo usermod -aG docker $USER`, then log out and back in. Until then, `sudo make` works. |

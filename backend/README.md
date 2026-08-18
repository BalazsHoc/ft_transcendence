# Transcendence Sports Backend MVP

Django backend for the Transcendence Sports MVP: users, JWT auth, events, participation and waiting lists, plus event chat over WebSocket.

## Stack

- Django 5
- Django REST Framework
- SimpleJWT
- SQLite for local development
- PostgreSQL for Docker-based development
- Django Channels
- Daphne
- drf-spectacular / Swagger
- Docker Compose

## Local Development Without Docker

This project uses SQLite by default in local development, so you can run it without PostgreSQL or Docker.

### 1. Create and activate a virtual environment

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Create your environment file

```bash
cp .env.example .env
```

If you are on PowerShell:

```powershell
Copy-Item .env.example .env
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Start the server

```bash
python manage.py runserver
```

Use Daphne to run the ASGI app so WebSocket chat works in development:

```bash
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

The backend will be available at:

```text
http://localhost:8000
```

Swagger UI:

```text
http://localhost:8000/api/docs/
```

The read-only public API is documented in the same Swagger UI under the
`Public API` tag. It uses an `X-API-Key` header and is rate-limited per key and
source IP. Issue a key from the backend directory (the raw key is printed only
once):

```bash
python manage.py create_public_api_key --name "local integration"
```

Public API examples:

```text
GET /api/public/v1/health/
GET /api/public/v1/sports/
GET /api/public/v1/districts/
GET /api/public/v1/events/
GET /api/public/v1/groups/
GET /api/public/v1/users/
```

Send the issued key with every request:

```bash
curl -H "X-API-Key: tr_pub_<issued-key>" http://localhost:8000/api/public/v1/groups/
```

The database stores only a salted hash of the key. Revoke keys from Django
admin or issue a replacement through the management command.

See [PUBLIC_API.md](PUBLIC_API.md) for the complete endpoint and query
parameter contract.

Admin:

```text
http://localhost:8000/admin/
```

### 6. Create a superuser

```bash
python manage.py createsuperuser
```

### 7. Load demo data

macOS/Linux:

```bash
python manage.py shell < scripts/create_demo_data.py
```

PowerShell:

```powershell
Get-Content scripts/create_demo_data.py | python manage.py shell
```

To generate a larger local dataset for testing event and group pagination, run:

```bash
python manage.py seed_pagination_demo
```

The command is idempotent and creates demo profiles for 34 well-known athletes,
one group per profile, three future events and one past archive event per
profile, plus ten individual future events distributed around Vienna for map
testing. Newly created demo accounts use `demo-pass-123` unless `--password`
is provided. The generated profiles and events are for local testing only.

## Run With Docker

From the repository root (not this directory):

```bash
make
```

Open https://localhost and accept the self-signed certificate warning.

See [DEVOPS.md](../DEVOPS.md) for architecture, environment, and how the sqlite database is shared.

Create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

## API Endpoints

### Auth

```text
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/refresh/
GET    /api/auth/me/
PATCH  /api/auth/me/
```

Registration accepts `email`, `name`, `password`, `password_confirm` and a district
code from `GET /api/meta/districts/`. Login accepts the email and password; passwords
are validated with Django's password validators and stored using Django's salted hash.

```text
GET    /api/meta/districts/
GET    /api/meta/sports/
```

### Events

```text
GET    /api/events/
POST   /api/events/
GET    /api/events/{id}/
PATCH  /api/events/{id}/
DELETE /api/events/{id}/
POST   /api/events/{id}/join/
POST   /api/events/{id}/leave/
GET    /api/events/{id}/messages/
GET    /api/groups/{id}/events/
POST   /api/groups/{id}/events/  # group owner only
```

Event and group collection endpoints use page-number pagination. The default
page size is 12 and clients may request up to 100 items with `page_size`:

```text
GET /api/events/?page=2&page_size=12
GET /api/groups/?page=2&page_size=12
```

Responses contain `count`, `next`, `previous` and the current page in
`results`. Event filters (`sport`, comma-separated `level`, `search`,
`start_after`, `start_before`) and group filters (`sport`, comma-separated
`level`, `search`) are applied before pagination.

### WebSocket Chat

```text
ws://localhost:8000/ws/events/{event_id}/?token=<access_token>
```

Send a message:

```json
{"text": "Hello everyone!"}
```

## Social, Messages and Notifications

The friendship, direct-message and notification contracts are documented in
[SOCIAL_API.md](SOCIAL_API.md). The main routes are:

```text
GET/POST /api/users/ and /api/friends/
GET/POST /api/messages/
GET/POST /api/notifications/
GET/POST /api/groups/{id}/messages/
WS       /ws/groups/{id}/?token=<jwt>
```

Friend requests and direct messages create recipient-only notifications. The
frontend polls the notification list and unread count every 30 seconds and
marks notifications as read when the user opens them.

## Run Tests

From the backend directory:

```bash
python manage.py test core groups social chat public_api
```

The repository currently keeps its test modules in those five app packages;
passing the labels explicitly runs the complete local suite.

## MVP Scope

Main entities:

```text
User
Event
EventParticipant
Message
```

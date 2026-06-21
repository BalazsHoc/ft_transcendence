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

## Run With Docker

```bash
cp .env.example .env
docker compose up --build
```

Create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

Load demo data:

```bash
docker compose exec backend python manage.py shell < scripts/create_demo_data.py
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
```

### WebSocket Chat

```text
ws://localhost:8000/ws/events/{event_id}/?token=<access_token>
```

Send a message:

```json
{"text": "Hello everyone!"}
```

## MVP Scope

Main entities:

```text
User
Event
EventParticipant
Message
```

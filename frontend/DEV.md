# Active Vienna (Transcendence Project)

## Project Overview

Active Vienna is a community-driven platform that helps people find sports activities, events, and training partners in Vienna.

The project starts as a 42 Transcendence project and is designed to be expandable into a real-world startup platform.

Main goals:

* Find sports events
* Create sports events
* Join events
* Event chat
* User profiles
* Multi-language support (EN / DE / RU)
* Future support for clubs, federations, and city organizations

---

# Technology Stack

## Backend

* Python 3.10+
* Django
* Django REST Framework
* PostgreSQL (production)
* SQLite (development)
* JWT Authentication
* Django Channels
* Daphne
* WebSockets

## Frontend

* React
* TypeScript
* Vite
* React Router
* React-i18next

---

# Local Development Setup

## Backend

Create virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Apply migrations:

```bash
python manage.py migrate
```

Create admin user:

```bash
python manage.py createsuperuser
```

Run development server:

```bash
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000
```

### WebSocket Development

Run Daphne:

```bash
daphne -b 127.0.0.1 -p 8000 core.asgi:application
```

---

## Frontend

Install packages:

```bash
npm install
```

Create .env:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
```

Run:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# Project Modules

## Authentication

Features:

* Registration
* Login
* JWT Authentication
* Profile management

---

## Events

Features:

* Create event
* Edit event
* Delete event
* Browse events
* Join event
* Leave event
* Waiting list

---

## Chat

Features:

* Event-specific chat
* WebSocket communication
* Live messages

---

## Profile

Features:

* Languages
* Sports interests
* District
* Activity history

---

## Internationalization (i18n)

Supported languages:

* English
* German
* Russian

All visible UI text must be translated.

Never hardcode user-facing strings inside components.

Use:

```tsx
const { t } = useTranslation();

<h1>{t("event.title")}</h1>
```

---

# Git Workflow

Main branches:

```text
main
develop
```

Feature branches:

```text
feature/login
feature/events
feature/chat
feature/profile
```

Bugfix branches:

```text
fix/chat-scroll
fix/event-filter
```

---

# Commit Message Convention

## Feature

```text
FEAT: add event creation API
FEAT: implement websocket chat
FEAT: add profile page
```

## Bug Fix

```text
FIX: correct event serializer
FIX: websocket authentication issue
FIX: waiting list promotion bug
```

## Refactoring

```text
REFACTOR: split event service layer
REFACTOR: simplify auth context
```

## UI

```text
UI: add event details page
UI: improve mobile navigation
```

## Documentation

```text
DOCS: update setup instructions
DOCS: add API examples
```

## Database

```text
DB: add event language index
DB: optimize participant query
```

---

# Pull Requests

Every PR should contain:

* Description
* Screenshots (if UI changes)
* API changes
* Database changes
* Testing notes

Example:

```text
Summary:
Added event join/leave functionality.

Changes:
- New API endpoint
- Frontend integration
- Waiting list support

Tested:
- Local backend
- Local frontend
```

---

# Coding Guidelines

## Backend

* Use type hints whenever possible
* Keep serializers small
* Business logic belongs in services, not views
* Avoid duplicated queries

## Frontend

* Keep components small
* Reusable UI components first
* Separate API calls from UI
* Use TypeScript types for API responses

---

# Long-Term Vision

Future versions may include:

* Mobile application
* Club management
* Federation integration
* City organization partnerships
* Recommendation engine
* Public sports infrastructure map
* Premium subscriptions
* Sponsor and shop integrations

The current MVP should remain focused on:

1. Users
2. Events
3. Participation
4. Communication

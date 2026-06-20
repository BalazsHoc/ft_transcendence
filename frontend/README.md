# Active Vienna API Frontend

Frontend для теста Django API.

```bash
npm install
cp .env.example .env
npm run dev
```

Backend:

```bash
python manage.py runserver
```

Для WebSocket:

```bash
daphne -b 127.0.0.1 -p 8000 core.asgi:application
```

CORS в backend `.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

Реализовано: register, login, me/profile, events CRUD, join/leave, messages, WebSocket chat, i18n EN/DE/RU.

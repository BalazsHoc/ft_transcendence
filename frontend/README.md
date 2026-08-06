# Active Vienna API Frontend

Frontend for Transcendence Django API.

```bash
npm install
cp .env.example .env
npm run dev
```

Backend:

To run backend see backend/README.md

Realisation: register, login, me/profile, events CRUD, owner-created group events,
join/leave, groups,
friendships, direct messages, group chats, header notifications, WebSocket chat, and i18n
EN/DE/UA.

## Verification

```bash
npm run build
```

The build runs TypeScript checking before creating the production bundle.

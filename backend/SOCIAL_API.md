# Friendship and notifications API

All endpoints below require a JWT access token in the `Authorization: Bearer …`
header. User search never returns email addresses.

## Users

```text
GET /api/users/?search=<username-or-name>
GET /api/users/<uuid>/
```

Returns up to 50 public users, excluding the authenticated user. Each result
includes `friendship_status`: `none`, `outgoing_pending`,
`incoming_pending`, `accepted`, `rejected`, or `blocked`, plus `friendship_id`
when a relationship exists. The detail endpoint is also available without
authentication and returns one public profile; anonymous requests receive
`friendship_status: none` and `friendship_id: null`. Neither endpoint exposes
email or authentication fields.

## Friendships

```text
GET    /api/friends/
GET    /api/friends/requests/incoming/
GET    /api/friends/requests/outgoing/
POST   /api/friends/requests/                  {"user_id": "<uuid>"}
POST   /api/friends/requests/<id>/accept/
POST   /api/friends/requests/<id>/reject/
DELETE /api/friends/<id>/
```

The backend stores one canonical row per user pair (`user_low`, `user_high`).
Only the request recipient can accept or reject a pending request. Friends
and requests are always filtered to the authenticated user; another user
cannot read, change, or remove someone else's relationship.

Creating a request creates a `friend_request` notification. Accepting one
creates a `friend_accepted` notification for the original requester.

## Direct messages

```text
GET  /api/messages/conversations/
POST /api/messages/conversations/                  {"user_id": "<uuid>"}
GET  /api/messages/conversations/<uuid>/
GET  /api/messages/conversations/<uuid>/messages/
POST /api/messages/conversations/<uuid>/messages/  {"text": "Hello"}
WS   /ws/direct/<uuid>/?token=<jwt>
```

Direct conversations are available only for accepted friendships. The
conversation is created lazily when a friend opens the message action. REST
and WebSocket messages use the same privacy checks, and every delivered
message creates a recipient-only `direct_message` notification.

## Notifications

```text
GET  /api/notifications/
GET  /api/notifications/?unread=true
GET  /api/notifications/unread-count/
POST /api/notifications/<id>/read/
POST /api/notifications/read-all/
```

Notifications are recipient-only. The payload contains the notification type,
public actor, JSON `payload`, optional `target_url`, `read_at`, and
`created_at`. `read-all` returns `{ "updated": <count> }`.

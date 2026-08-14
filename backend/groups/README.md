# Groups API

Groups are lightweight sport communities. A group has a sport, one or more supported
levels, a location, languages, a capacity, a visibility setting and a join policy.

## Group fields

| Field | Purpose |
| --- | --- |
| `sport` | Main activity, for example `running` or `cycling` |
| `levels` | Non-empty list: `beginner`, `intermediate`, `advanced`, or `all` |
| `kind` | `training`, `social`, `competitive`, or `team` |
| `visibility` | `public` or `private` |
| `join_policy` | `open`, `approval`, or `invite_only` |
| `max_members` | Membership limit; `0` means unlimited |
| `languages`, `location_name`, `location_address` | Helps people find an appropriate local group |

The creator is automatically an active `owner`. Other memberships have an `admin` or
`member` role and an `active` or `pending` status.

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| GET, POST | `/api/groups/` | List public/visible groups; authenticated users create |
| GET, PATCH, DELETE | `/api/groups/{id}/` | Public read; owner/admin updates; owner/admin delete |
| POST | `/api/groups/{id}/join/` | Authenticated users, subject to join policy |
| POST | `/api/groups/{id}/leave/` | Active or pending members, except owner |
| GET | `/api/groups/{id}/members/` | Authenticated; private group requires membership |
| GET, POST | `/api/groups/{id}/events/` | Public events are visible to all; only the group owner creates |
| GET, POST | `/api/groups/{id}/messages/` | Active members only; group chat history and REST fallback send |
| WS | `/ws/groups/{id}/?token=<jwt>` | Active members only; live group chat |

## Group events

Events now include an optional `group` and a `visibility` field. `public` events are
listed normally. A `private` group event is visible and joinable only to active members
of its group. The group owner creates group events through
`POST /api/groups/{id}/events/`; the endpoint sets the group and creator automatically.

Group messages create a recipient-only `group_message` notification for every
other active member. Notifications link back to `/groups/{id}#group-chat`.

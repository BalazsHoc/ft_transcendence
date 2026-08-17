# Groups API

Groups are public sport communities with free, immediate membership. A group has
a sport, one or more supported levels, a location, languages, a cover image and
an optional capacity (`max_members`; `0` means unlimited).

## Group fields

| Field | Purpose |
| --- | --- |
| `sport` | Main activity, for example `running` or `cycling` |
| `levels` | Non-empty list: `beginner`, `intermediate`, `advanced`, or `all` |
| `max_members` | Membership limit; `0` means unlimited |
| `languages`, `location_name`, `location_address` | Helps people find an appropriate local group |

The creator is automatically an `owner`. Other memberships have an `admin` or
`member` role and joining always creates an active membership.

The old `kind`, `visibility`, and `join_policy` columns remain only as a
backwards-compatible database detail while existing data is migrated. They are
not accepted or returned by the API: every group is public and joining is
immediate. Pending/approval/invite-only flows are not part of the MVP.

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| GET, POST | `/api/groups/` | Public list; authenticated users create |
| GET, PATCH, DELETE | `/api/groups/{id}/` | Public read; owner/admin updates; owner/admin delete |
| POST | `/api/groups/{id}/join/` | Authenticated users, immediately joins |
| POST | `/api/groups/{id}/leave/` | Members, except owner |
| GET | `/api/groups/{id}/members/` | Authenticated; all memberships are visible because groups are public |
| GET, POST | `/api/groups/{id}/events/` | Public events are visible to all; only the group owner creates |
| GET, POST | `/api/groups/{id}/messages/` | Members only; group chat history and REST fallback send |
| WS | `/ws/groups/{id}/?token=<jwt>` | Members only; live group chat |

## Group events

Events include an optional `group` and retain their own `visibility` field. Public
events are listed normally. A `private` group event is visible and joinable only
to members of its public group. The group owner creates group events through
`POST /api/groups/{id}/events/`; the endpoint sets the group and creator automatically.

Group messages create a recipient-only `group_message` notification for every
other member. Notifications link back to `/groups/{id}#group-chat`.

Group lifecycle notifications are sent to members (excluding the actor): group
updates/deletions, group-event creation/updates/deletions, and immediate joins or
leaves. Group-event notifications link to the event page; group lifecycle and
membership notifications link to the group page.

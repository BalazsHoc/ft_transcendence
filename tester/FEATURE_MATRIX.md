# Feature Matrix — ft_transcendence (Vienna Active)

Complete inventory of every user-visible route, API endpoint, and WebSocket
channel, mapped against the automated tester. Built by reading `frontend/src`
(routes, pages, `api/*.ts`), `backend/**/urls.py` + views, `backend/chat`
(consumers/routing), `POINTS.md`, `frontend/BROWSER_SUPPORT.md`, and every
`tester/suites/*.sh` + `tester/browser/*.js`.

Legend:
- **Tested?** — suite id / browser step that already covers it (verified depth,
  not just presence).
- **Gap** — `—` none, `P0` eval-critical, `P1` user-facing, `P2` nice-to-have.
- Suites: `10_auth`, `11_events`, `12_social`, `13_groups`, `14_geo` (new),
  `15_notifications` (new), `16_profile` (new), `17_social_lifecycle` (new),
  `18_events_write` (new), `19_groups_write` (new), `20_modules`,
  `21_websockets` (new), `07_browser`, `08_forms`.

---

## 1. Frontend routes (App.tsx)

| ID | Route | Page | Auth? | Expected outcome | Tested? | Gap |
|----|-------|------|-------|------------------|---------|-----|
| R-01 | `/` | LandingPage | no | Marketing landing, footer legal links | `07_browser` public + `BR-J-*-landing` | — |
| R-02 | `/login` | LoginPage | no | Email/pw form + Google button | journey `login`,`invalid-login`,`empty-login-validation` | — |
| R-03 | `/register` | RegisterPage | no | Signup form, mismatch validation | journey `register-page`,`register-validation` | — |
| R-04 | `/discover` | DiscoverPage | no | Event discovery, filters, theme, i18n | journey `nav-discover`; theme/i18n | P1 filters |
| R-05 | `/groups` | GroupsPage | no | Group list, search, create | journey `groups-search`,`create-group` | — |
| R-06 | `/groups/:groupId` | GroupDetailsPage | no | Group detail, join, chat, members | journey `open-group`,`join-group` | — |
| R-07 | `/groups/:groupId/edit` | EditGroupPage | admin | Edit group form (owner/admin) | none | P1 |
| R-08 | `/map` | MapPage | no | Leaflet map, style, address search | journey `map-interact` (load only) | P1 search |
| R-09 | `/events/new` | CreateEventPage | yes | Create-event form | journey `create-event-form` (open only) | P1 submit |
| R-10 | `/events/:eventId` | EventDetailsPage | no | Event detail, join/leave, chat | journey `open-event`,`event-*` | — |
| R-11 | `/events/:eventId/edit` | EditEventPage | owner | Edit-event form | none | P1 |
| R-12 | `/my-events` | MyEventsPage | yes | User's events | journey `my-events` (visit only) | P2 |
| R-13 | `/chats` | ChatsPage | yes | DM + event + group conversations | journey `chats-interact`,`send-direct-message`; multi-user | — |
| R-14 | `/chats?userId=` | ChatsPage (deep link) | yes | Opens/creates DM with user | multi-user `send-dm` | — |
| R-15 | `/profile` | ProfilePage | yes | Own profile + edit + friends | journey `profile-interact` (visit only) | P0 edit |
| R-16 | `/users/:userId` | UserProfilePage | no | Public profile, add friend/message | journey `visit-user-profile` | — |
| R-17 | `/api-test` | ApiTesterPage | — | Dev API playground | none | P2 (dev) |
| R-18 | `/ui-elements-test` | UiElementsTest | — | Dev component gallery | none | P2 (dev) |
| R-19 | `/privacy-policy` | PrivacyPolicyPage | no | Legal content | `BR-legal-*`, journey `footer-privacy` | — |
| R-20 | `/terms-of-service` | TermsOfServicePage | no | Legal content | `BR-legal-*`, journey `footer-terms` | — |
| R-21 | `/auth/google/callback` | GoogleCallbackPage | no | Exchanges ticket → tokens | none (needs real Google) | P2 (HUMAN) |
| R-22 | `/clubs` → `/groups` | Navigate redirect | no | Redirects to /groups | none | P1 (easy) |
| R-23 | `/friends` → `/profile` | Navigate redirect | no | Redirects to /profile | none | P1 (easy) |
| R-24 | `*` | NotFoundPage | no | 404 page | journey `not-found` | — |

---

## 2. Auth & user management (`/api/auth/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| A-01 | Register | POST `/api/auth/register/` | no | 201 + tokens; 400 on dup/invalid | `AUTH-02`,`AUTH-06`; `VAL-01..05` | — |
| A-02 | Login | POST `/api/auth/login/` | no | 200 + JWT; 401 wrong pw | `AUTH-03`,`AUTH-07`,`AUTH-08` | — |
| A-03 | Refresh | POST `/api/auth/refresh/` | no | 200 new access | `AUTH-05` | — |
| A-04 | Get me | GET `/api/auth/me/` | yes | 200 profile; 401 no token | `AUTH-04`,`AUTH-09/10`,`MOD-W3b` | — |
| A-05 | Edit me | PATCH `/api/auth/me/` | yes | Update bio/district/langs/avatar | none | **P0** |
| A-06 | Google start | GET `/api/auth/google/start/` | no | 302 → accounts.google.com | `AUTH-google`,`MOD-U2`; journey `google-oauth` | — |
| A-07 | Google callback | GET `/api/auth/google/callback/` | no | Exchange code → ticket redirect | none (needs Google) | P2 (HUMAN) |
| A-08 | Google exchange | POST `/api/auth/google/exchange/` | no | ticket→tokens; 401 invalid ticket | none | P2 |
| A-09 | Logout | client-side (clear tokens) | yes | Tokens cleared, redirect | none | P2 (UI) |

---

## 3. Events (`/api/events/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| E-01 | List (paginated) | GET `/api/events/` | no | 200 paginated, future only | `EVT-01/02`,`MOD-W7a` | — |
| E-02 | Filter sport/level/lang/search | GET `/api/events/?...` | no | 200 filtered | `EVT-04`,`MOD-W7a` | P1 level/date/lang depth |
| E-03 | Detail | GET `/api/events/:id/` | no | 200 | `EVT-03` | — |
| E-04 | Create | POST `/api/events/` | yes | 201; 400 empty | `VAL-06` (empty only) | **P1** happy path |
| E-05 | Update | PATCH `/api/events/:id/` | owner/admin | 200; 403 non-owner | none | **P1** |
| E-06 | Delete | DELETE `/api/events/:id/` | owner/admin | 204; 403 non-owner | none | P1 |
| E-07 | Join | POST `/api/events/:id/join/` | yes | 201; 401 no token | `EVT-05/06` | — |
| E-08 | Leave | POST `/api/events/:id/leave/` | yes | 200 (+promote) | `EVT-07` | — |
| E-09 | Waiting list | join when full → status=waiting | yes | queue_position>0 | none | P2 |
| E-10 | Private/group-only join guard | POST join | yes | 403 if not group member | none | P2 |
| E-11 | Messages (REST history) | GET `/api/events/:id/messages/` | yes | 200/403 | `EVT-08` | — |
| E-12 | 404 unknown event | GET `/api/events/<bad>/` | no | 404 | none | P2 |

---

## 4. Groups (`/api/groups/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| G-01 | List (paginated) | GET `/api/groups/` | no | 200 paginated | `GRP-01` | — |
| G-02 | Filter/search | GET `/api/groups/?search=` | no | 200 | `GRP-04` | — |
| G-03 | Detail | GET `/api/groups/:id/` | no | 200 detail + memberships | `GRP-03` | — |
| G-04 | Create | POST `/api/groups/` | yes | 201, owner membership | UI journey `create-group` only | **P1** API |
| G-05 | Update | PATCH `/api/groups/:id/` | admin | 200; 403 non-admin | none | **P1** |
| G-06 | Delete | DELETE `/api/groups/:id/` | admin | 204 | none | P2 |
| G-07 | Join | POST `/api/groups/:id/join/` | yes | 201; 401 no token | `GRP-06/07` | — |
| G-08 | Leave | POST `/api/groups/:id/leave/` | yes | 204; owner blocked | none | **P1** |
| G-09 | Members | GET `/api/groups/:id/members/` | yes | 200/403 + roles | `GRP-05` (no role assert) | P2 |
| G-10 | Group events list | GET `/api/groups/:id/events/` | no | 200 | `GRP-08` | — |
| G-11 | Group event create | POST `/api/groups/:id/events/` | owner | 201; 403 non-owner | none | **P1** |
| G-12 | Group messages (REST) | GET/POST `/api/groups/:id/messages/` | member | 200/403 | `GRP-09` (GET only) | P1 POST |

---

## 5. Social — friends & profiles (`/api/friends/`, `/api/users/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| S-01 | User search | GET `/api/users/?search=` | yes | 200 list | `SOC-01/02`,`MOD-W3a` | — |
| S-02 | Public profile | GET `/api/users/:id/` | no | 200 (no email) | `SOC-03` | — |
| S-03 | Presence | GET `/api/users/:id/presence/` | no | 200 is_online | `SOC-04` | — |
| S-04 | Activities | GET `/api/users/:id/activities/` | no | 200 event list | `SOC-05` | — |
| S-05 | Friends list | GET `/api/friends/` | yes | 200 | `SOC-06`,`MOD-W3c` | — |
| S-06 | Incoming requests | GET `/api/friends/requests/incoming/` | yes | 200 | `SOC-07` | — |
| S-07 | Outgoing requests | GET `/api/friends/requests/outgoing/` | yes | 200 | `SOC-08` | — |
| S-08 | Send request | POST `/api/friends/requests/` | yes | 201; 400 self | `SOC-08b`,`VAL-07` | — |
| S-09 | Accept | POST `/api/friends/requests/:id/accept/` | yes | 200 accepted | `SOC-08b` (bootstrap) | P1 explicit |
| S-10 | Reject | POST `/api/friends/requests/:id/reject/` | yes | 200 rejected | none | **P1** |
| S-11 | Remove/unfriend | DELETE `/api/friends/:id/` | yes | 204 | none | **P1** |

---

## 6. Direct messages (`/api/messages/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| D-01 | Conversations list | GET `/api/messages/conversations/` | yes | 200; 401 no token | `SOC-09/12`,`MOD-W3d` | — |
| D-02 | Create/get conversation | POST `/api/messages/conversations/` | yes (friends) | 200/201 | `SOC-09b` | — |
| D-03 | Conversation detail | GET `/api/messages/conversations/:id/` | yes | 200 | none | P2 |
| D-04 | Messages list | GET `.../:id/messages/` | yes | 200 | `SOC-10` | — |
| D-05 | Send message | POST `.../:id/messages/` | yes | 201 (both users) | `SOC-11`,`SOC-13` | — |

---

## 7. Notifications (`/api/notifications/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| N-01 | List | GET `/api/notifications/` | yes | 200; 401 no token | `MOD-W6a`,`AUTH-09` | — |
| N-02 | Unread filter | GET `/api/notifications/?unread=true` | yes | 200 unread only | none | P1 |
| N-03 | Unread count | GET `/api/notifications/unread-count/` | yes | 200 {count} | `MOD-W6b/c` | — |
| N-04 | Mark one read | POST `/api/notifications/:id/read/` | yes | 200, read_at set | none | **P0** |
| N-05 | Mark all read | POST `/api/notifications/read-all/` | yes | 200 {updated} | none | **P0** |
| N-06 | Notification pipeline (CRUD triggers) | via friend/event/group actions | yes | count increments | `MOD-W6c/d` | — |
| N-07 | Bell UI open | header notifications | yes | dropdown opens | journey `notifications` | P1 mark-read UI |

---

## 8. Map / geo (`/api/geo/`, `/api/meta/`)

| ID | Action | Method + path | Auth? | Expected | Tested? | Gap |
|----|--------|---------------|-------|----------|---------|-----|
| M-01 | Map tile style | GET `/api/geo/map-style/` | no | 200 light/dark URLs | `MOD-M1a` | — |
| M-02 | Location search | GET `/api/geo/search/?q=` | no | 200 (or 502 provider) | `MOD-M1b` | P1 depth |
| M-03 | Reverse geocode | GET `/api/geo/reverse/?lat&lon` | no | 200 (or 502); 400 bad | none | **P1** |
| M-04 | Remember search | POST `/api/geo/remember/` | no | 201 cached; 400 bad | none | P2 |
| M-05 | Sports catalog | GET `/api/meta/sports/` | no | 200 list | indirect | P2 |
| M-06 | Districts catalog | GET `/api/meta/districts/` | no | 200 list | `AUTH-01` | — |
| M-07 | Map UI search | MapPage address search | no | suggestions render | none | P1 |

---

## 9. Public API (`/api/public/v1/`)

| ID | Action | Method + path | Key? | Expected | Tested? | Gap |
|----|--------|---------------|------|----------|---------|-----|
| P-01 | Health | GET `/health/` | yes | 200; 401 no key | `MOD-W4b/c` | — |
| P-02 | Sports | GET `/sports/` | yes | 200 | `MOD-W4b` | — |
| P-03 | Districts | GET `/districts/` | yes | 200 | `MOD-W4b` | — |
| P-04 | Events list | GET `/events/` | yes | 200 paginated | `MOD-W4b`,`MOD-W7b` | — |
| P-05 | Events detail | GET `/events/:id/` | yes | 200 | none | P2 |
| P-06 | Events filters | `?sport&level&language&search&ordering` | yes | 200 | `MOD-W7b` (ordering) | P2 |
| P-07 | Groups list/detail | GET `/groups/` | yes | 200 | `MOD-W4b` (list) | P2 detail |
| P-08 | Users list/detail | GET `/users/` | yes | 200 | `MOD-W4b` (list) | P2 detail |
| P-09 | API key required | any without `X-API-Key` | — | 401/403 | `MOD-W4c` | — |
| P-10 | Rate limiting | burst same key | yes | 429 | `MOD-W4g` | — |
| P-11 | Swagger docs | GET `/api/docs/` | no | 200 HTML | `MOD-W4d` | — |
| P-12 | OpenAPI schema | GET `/api/schema/` | no | 200 | `MOD-W4e` | — |

---

## 10. WebSockets (`/ws/`)

| ID | Channel | URL | Auth | Expected | Tested? | Gap |
|----|---------|-----|------|----------|---------|-----|
| WS-01 | Presence | `/ws/presence/?token=` | JWT | heartbeat/presence msg; 4001 no auth | `MOD-W2`,`TLS-04` | — |
| WS-02 | Event chat | `/ws/events/:id/?token=` | member | send `{text}` → `{type:message}`; 4003 non-member | none | **P0** |
| WS-03 | Group chat | `/ws/groups/:id/?token=` | member | send/receive; 4003 non-member | none | **P1** |
| WS-04 | Direct chat | `/ws/direct/:conv/?token=` | friend | send/receive; 4001 no auth | none | **P1** |

---

## 11. Modules (POINTS.md — need 14 of 20 pts)

| Module | Pts | Tested? | Gap |
|--------|-----|---------|-----|
| W-1 Frameworks (React + Django) | 2 | `MOD-W1` | — |
| W-2 Real-time WebSockets | 2 | `MOD-W2` (presence) | P0 chat WS depth |
| W-3 Chat + profile + friends | 2 | `MOD-W3a-d` | — |
| W-4 Public API (key, rate-limit, docs, ≥5) | 2 | `MOD-W4*` | — |
| W-5 ORM | 1 | `ARC-02` | — |
| W-6 Notifications (CRUD) | 1 | `MOD-W6*` | P0 read/read-all |
| W-7 Advanced search | 1 | `MOD-W7*` | — |
| W-8 Design system (≥10 comp.) | 1 | `STY-03` | — |
| A-1 i18n (≥3 langs) | 1 | `MOD-A1` | — |
| A-2 Additional browser support | 1 | `MOD-A2` (doc only) | P0 automate |
| U-1 Standard auth | 2 | `MOD-U1`, suite 10 | — |
| U-2 Google OAuth | 1 | `MOD-U2` | — |
| M-1 Map integration | 2 | `MOD-M1*` | P1 reverse/UI |
| M-2 Dark/Light theme | 1 | `MOD-M2`, `BR-theme` | — |

---

## 12. Cross-cutting UI

| ID | Feature | Tested? | Gap |
|----|---------|---------|-----|
| UI-01 | i18n switcher (≥3 langs) | `BR-i18n`, journey `language-switch` | — |
| UI-02 | Dark/light theme toggle | `BR-theme`, journey `theme-toggle` | — |
| UI-03 | Responsive / mobile hamburger nav | journey mobile viewport, `mobile-menu` | — |
| UI-04 | Footer legal links | `BR-footer` | — |
| UI-05 | Console-error-free (STRICT) | every journey step tracker | — |
| UI-06 | Cross-browser smoke (Chrome+Firefox/Edge) | none | **P0** |
| UI-07 | Two users simultaneously | multi-user.js | — |

---

## Prioritized gap summary

**P0 (eval-critical):**
- A-05 Profile edit `PATCH /api/auth/me/` → new suite `16_profile.sh`
- N-04/N-05 Notification mark-read / read-all → new suite `15_notifications.sh`
- WS-02 Event chat WebSocket → new suite `21_websockets.sh` + `event-ws-test.js`
- UI-06 Cross-browser smoke → `cross-browser.js` + `14_cross_browser.sh`

**P1 (user-facing):**
- E-04/E-05/E-06 Event create/edit/delete + 403 guard → `18_events_write.sh`
- G-04/G-05/G-08/G-11/G-12 Group create/edit/leave/group-event/chat-post → `19_groups_write.sh`
- S-09/S-10/S-11 Friend accept/reject/remove lifecycle → `17_social_lifecycle.sh`
- M-03 Geo reverse (+search depth) → `14_geo.sh`
- WS-03/WS-04 Group + direct chat WebSocket → `21_websockets.sh`
- R-22/R-23 Route redirects; R-15 profile-edit UI; M-07 map-search UI → browser
- N-02 unread filter; N-07 mark-read UI

**P2 (nice-to-have):**
- E-09 waiting list, E-10 private guard, E-12 404, P-05/07/08 public detail,
  M-04 remember, M-05 sports meta, D-03 conv detail, R-17/18 dev pages,
  A-08 Google exchange invalid ticket, G-06 group delete.

**HUMAN-only (stays in `99_manual.sh`):**
- Google password entry / full OAuth completion (A-07, R-21)
- Live DevTools-clean demo, clean-clone deploy, per-member role explanations.

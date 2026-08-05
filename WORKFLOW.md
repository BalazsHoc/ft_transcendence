Here we will share our thoughts on our project workflow.

| Proposed Feature | Description | Status | By Whom |
| --- | --- | --- | --- |
| Map page with event markers and address search | Added a map view, address autocomplete, and event markers; search is biased to Vienna and uses MapTiler on the backend | DONE | Alex |
| Event address workflow | Search input keeps the street name, the full address is saved separately, and house numbers stay visible in event cards and details | DONE | Alex |
| Geo cache | Store only final selected searches in the backend so we can reuse them later without spamming external requests | DONE | Alex |
| CSS modules cleanup | Moved page-specific and component-specific styles out of global CSS into local modules, keeping global styles for shared layout only | DONE | Alex |
| Joined chats only | Chats page now shows only events the current user has joined, so private chat access stays scoped to memberships | DONE | Alex |
| Media uploads | Added avatar upload for user profiles and image upload for events with backend media storage and multipart form submissions | DONE | Alex |
| Groups and group events API | Added sport groups with levels, visibility, join policies, roles, membership limits and locations; groups can create public or private events | DONE | Alex |
| Shared sports catalog | Added 20 backend-validated sport codes, a public sports metadata endpoint, and frontend filters that load their options from the API | DONE | Alex |
| Friends and notifications API | Added canonical friendship requests, public user search without email exposure, recipient-only in-app notifications, read/unread endpoints and privacy tests | DONE | Alex |
| Public user profiles | Added a universal profile route with edit mode for the current user, read-only public profiles with friendship actions, and profile links for group owners | DONE | Alex |
| Personal messages | Added friend-only direct conversations, REST and WebSocket message delivery, recipient notifications, and a testable personal chat alongside event chats | DONE | Alex |

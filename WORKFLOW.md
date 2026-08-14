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
| Friends management UI | Added user search, incoming and outgoing request controls, friend list actions and direct message links inside the signed-in profile | DONE | Alex |
| Notifications UI | Added authenticated header polling, unread badge, notification actions and navigation for friend and message notifications | DONE | Alex |
| Group chat | Added active-member-only REST/WebSocket group chats with recipient notifications and group-page UI | DONE | Alex |
| Group event creation | Group owners can create public or private events from the group page; event cards and details link back to the group | DONE | Alex |
| Map marker semantics | Map markers use separate colors for individual and group events instead of sport-specific colors, with a localized legend | DONE | Alex |
| Chats page redesign | Restyled the personal messages and event chats page with cards, avatars, status dots and chat bubbles, and made the layout fill the screen instead of scrolling | DONE | Mina |
| Header | Split the header into small reusable pieces — brand, nav, user menu, language switcher — plus shared Button/IconButton components | DONE | Mina |
| Sidebar and filters | Built the Discover page's filter sidebar (category, level, time) as one reusable FilterGroup component | DONE | Mina |
| Discover page | Built the Happening Now and Curated for You sections with reusable event cards and a shared Badge component | DONE | Mina |
| Landing page | Added the logged-out welcome page with a hero banner and curated experience cards | DONE | Mina |
| Map page | Rewrote the map page with Leaflet markers, filters, zoom controls and an event detail panel | DONE | Mina |
| Profile page | Built the original profile page layout — side nav, hero, edit form, activity and achievements cards | DONE | Mina |
| Email authentication and registration validation | Login uses email; registration validates name, email, password confirmation and a backend-provided Vienna district list on both frontend and backend | DONE | Alex |

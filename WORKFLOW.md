Here we will share our thoughts on our project workflow.

| Proposed Feature | Description | Status | By Whom |
| --- | --- | --- | --- |
| Map page with event markers and address search | Added a map view, address autocomplete, and event markers; search is biased to Vienna and uses MapTiler on the backend | DONE | Alex |
| Event address workflow | Search input keeps the street name, the full address is saved separately, and house numbers stay visible in event cards and details | DONE | Alex |
| Geo cache | Store only final selected searches in the backend so we can reuse them later without spamming external requests | DONE | Alex |
| CSS modules cleanup | Moved page-specific and component-specific styles out of global CSS into local modules, keeping global styles for shared layout only | DONE | Alex |
| Joined chats only | Chats page now shows only events the current user has joined, so private chat access stays scoped to memberships | DONE | Alex |

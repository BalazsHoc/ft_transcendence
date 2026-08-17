# Browser support and compatibility

The frontend targets modern desktop and mobile browsers. The supported set for
the production build is the latest two versions of Chrome/Chromium, Firefox,
Edge, and Safari, plus iOS Safari 15 or newer. Vite is configured for ES2020
JavaScript and Safari 15 CSS output; the Browserslist in `package.json` is the
single place to adjust the release baseline.

## Compatibility matrix

| Area | Chrome / Edge | Firefox | Safari / iOS Safari | Fallback or limitation |
|---|---|---|---|---|
| Routing, forms, validation | Supported | Supported | Supported | Uses standard React Router and HTML controls |
| Theme and responsive layout | Supported | Supported | Supported | CSS custom properties and media queries |
| WebSockets (chats/notifications) | Supported | Supported | Supported | Requires a reachable backend WebSocket endpoint; reconnect/error UI is shown when the connection is unavailable |
| Geolocation and map | Supported | Supported | Supported | Requires HTTPS (or localhost) and user permission; denied permission leaves the map usable without the current-location feature |
| File upload | Supported | Supported | Supported | Native picker behavior differs on iOS; image preview still uses `URL.createObjectURL` |
| Frosted surfaces | Supported | Supported | Supported | `backdrop-filter` is progressive enhancement; surfaces retain a solid/translucent background when blur is unavailable |
| Date/time formatting | Supported | Supported | Supported | Uses `Intl.DateTimeFormat`; displayed locale follows the selected language |

The layout no longer depends on CSS `:has()`: full-bleed pages receive an
explicit `page-container--full` class from `AppLayout`. This avoids selector
support differences in older Firefox, Edge, and Safari engines.

## Required smoke test per browser

Run the following flows in each supported browser at desktop and narrow mobile
widths:

1. Load the landing page, switch language and theme, and navigate through the
   header/footer links.
2. Register and log in with invalid and valid values; verify inline errors and
   logout.
3. Fetch groups, open group details, join a group, and create a group/event.
4. Open the map, search an Austrian/Vienna address, and check the permission
   denied geolocation path.
5. Open a direct/group chat, send a message, and verify notification updates.
6. Open a profile, edit a supported field, and check responsive card/layout
   behavior.

Record the browser version, viewport, result, and any limitation in the
release QA notes. A feature is considered compatible only when the same action
and visible state are available in all four browser families.

## Current verification status

Static checks are run from `frontend`:

```text
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

The current development machine does not have Firefox, Safari, Edge, or an
installed browser automation runner, so manual cross-browser smoke runs cannot
be truthfully marked complete from this workspace. The matrix above is the
acceptance checklist for the team/CI environment; attach screenshots or a
test report for each browser before claiming the minor point.

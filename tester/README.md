# ft_transcendence — Eval Sheet Tester

One command runs **every** check from the 42 eval sheet. Chrome **opens a window
with DevTools**, clicks through the app with a HUD overlay, then opens a
**second Chrome window** so two users act at the same time.

## Quick start

```bash
make                 # deploy
./tester/run.sh      # pick a run from the menu (Quick / Full / Live demo)
```

Read the last run:

```bash
cat tester/results/latest/summary.txt
cat tester/results/latest/failures.md    # copy-paste repro for each FAIL
```

## Commands

| Command | What it does |
|---------|----------------|
| `./tester/run.sh` | **Interactive menu** (in a terminal): pick Quick / Full / Live demo / Quick+fail-fast. |
| `./tester/run.sh --headless` | All suites, no window (skips the menu) |
| `./tester/run.sh --fast` | Skip slow rate-limit burst |
| `./tester/run.sh --fail-fast` | Stop at the first failing suite |
| `./tester/run.sh --strict-browsers` | Cross-browser: missing browsers FAIL instead of warn |
| `./tester/run.sh --list` | List suites |
| `./tester/run.sh events social browser` | Run matching suites only |
| `make test-eval` | Same as `./tester/run.sh` |

Read the last run:

```bash
cat tester/results/latest/summary.txt
cat tester/results/latest/failures.md    # copy-paste repro for each FAIL
cat tester/results/latest/coverage.tsv   # feature -> test IDs -> status
```

Watch only the browsers:

```bash
node tester/browser/check.js              # public pages + journey + two users
node tester/browser/user-journey.js       # Alex only
node tester/browser/multi-user.js         # Alex + Carlito, two windows
TESTER_HEADLESS=1 node tester/browser/check.js
```

## Cross-browser smoke (suite `22_cross_browser`)

The same **landing → login → navigate** journey runs in every installed
browser. Chrome/Chromium/Edge are driven over CDP; Firefox is attempted over
WebDriver BiDi. Browsers that are not installed are **warnings, not failures**
(pass `--strict-browsers` to make them fail).

```bash
# choose which browsers to try (default: chrome,edge,chromium,firefox)
TESTER_BROWSERS=chrome,firefox ./tester/run.sh --headless
TESTER_BROWSERS=chrome,edge node tester/browser/cross-browser.js   # headless helper
```

Browser binaries are auto-detected; override paths with
`CHROME_PATH`, `CHROMIUM_PATH`, `EDGE_PATH`, `FIREFOX_PATH` or a generic
`BROWSER_PATH`. WebKit/Safari is not drivable by `puppeteer-core` on Linux and
is reported as unsupported.

| Browser | Engine | How it runs | Notes |
|---------|--------|-------------|-------|
| Chrome | Blink | CDP (puppeteer-core) | primary; console-error suite |
| Chromium | Blink | CDP | if installed |
| Edge | Blink | CDP | separate binary, good second browser on Linux |
| Firefox | Gecko | WebDriver BiDi | best-effort; skipped if only the snap stub is present |
| WebKit | WebKit | — | unsupported by puppeteer-core (use Playwright) |

## Two users, two browsers, DevTools

Default (headed) run:

1. Chrome window **left** — Alex (`alex@example.com` / `testpass123`)
2. DevTools opens automatically (`--auto-open-devtools-for-tabs`)
3. Chrome window **right** — Carlito (`carlito@example.com` / `12345678`)
4. They befriend, send DMs both ways, join a group, chat in the group, join events

Hide the windows: `./tester/run.sh --headless`

## What the website tests click through

| Flow | Where |
|------|--------|
| Landing, privacy, terms, 404 | Chrome journey |
| Register page + mismatch validation | Chrome journey |
| **Google OAuth** — clicks “Continue with Google”, must reach `accounts.google.com` | Chrome + `/api/auth/google/start/` |
| Empty / wrong / valid login | Chrome journey |
| Discover, groups, map, chats, profile, my-events | Chrome journey |
| Open event, join, **send event chat** | Chrome journey |
| Search groups, open, **join group**, **send group chat** | Chrome journey |
| **Create group** | Chrome journey |
| **Send direct message** | Chrome journey |
| Visit another user, add-friend / message | Chrome journey |
| Theme + language | Chrome journey |
| **Two users at once** — DMs, reply, join group, group chat, join events | Second Chrome window |
| Register / login / JWT (API) | suite `10_auth` |
| Events join/leave/chat (API) | suite `11_events` |
| Friends + DMs both users (API) | suite `12_social` |
| Groups join/members/chat (API) | suite `13_groups` |
| Map/geo search, reverse, remember (API) | suite `14_geo` |
| Notifications list/unread/read/read-all (API) | suite `15_notifications` |
| Profile edit `PATCH /api/auth/me/` (API) | suite `16_profile` |
| Friend lifecycle reject/resend/unfriend (API) | suite `17_social_lifecycle` |
| Event create/edit/delete write paths (API) | suite `18_events_write` |
| Group create/edit/group-events/leave (API) | suite `19_groups_write` |
| Event/group/direct chat over WSS | suite `21_websockets` |
| Same journey in Chrome + Edge (+ Firefox) | suite `22_cross_browser` |

Google sign-in **cannot finish** without a real Google account. The tester
checks the start: the button exists and the app redirects to Google. Completing
the Google password screen is a live-defense (HUMAN) step.

Create-event opens the form; submitting a new event every run would pollute seed
data. Create-group **does** submit.

## Suites

| Suite | Eval sheet |
|-------|------------|
| `00_preflight` | Tools, repo, no alias tricks |
| `01_deploy` | Single-command Docker, healthy containers |
| `02_env_security` | `.env`, secrets, hashed passwords |
| `03_https` | TLS, WSS, no plain HTTP |
| `04_readme_git` | README + git collaboration |
| `07_browser` | Chrome + DevTools + two users + website flows |
| `08_forms` | Server-side validation, XSS/SQLi |
| `09_styling` | Tailwind, 3-tier, design system |
| `10_auth` | Register, login, JWT, Google start |
| `11_events` | Event list/detail/join/leave/chat |
| `12_social` | Friends, profiles, presence, DMs |
| `13_groups` | Groups list/detail/members/join/chat |
| `14_geo` | Map tile style, address search, reverse geocode, remember, catalogs |
| `15_notifications` | List, unread filter/count, mark-read, mark-all-read |
| `16_profile` | `GET`/`PATCH /api/auth/me/` (bio, district, languages, read-only, guards) |
| `17_social_lifecycle` | Friend request send/reject/resend/accept/list/unfriend + guards |
| `18_events_write` | Event create/edit/non-owner-403/join/leave/delete + cleanup |
| `19_groups_write` | Group create/edit/join/members/group-events/leave/owner-rules + cleanup |
| `20_modules` | All 20 claimed module points |
| `21_websockets` | Event / group / direct chat echo + unauth/forbidden rejection |
| `22_cross_browser` | Shared smoke across installed browsers (Chrome/Edge/Chromium/Firefox) |
| `99_manual` | Live defense checklist (human) |

New shell suites reuse helpers in `tester/lib/common.sh`
(`auth_h`, `register_user`, `ensure_friends`, `create_event`, `create_group`,
`first_sport`, `iso_future`) and self-clean any data they create. WebSocket
suites drive `tester/browser/chat-ws-test.js` over `wss://localhost`.

Every run also writes `tester/results/latest/coverage.tsv` — one row per check
(`feature`, `test_id`, `status`, `description`) mapping features to the tests
that exercise them.

## Module scoring

Major = 2 pts, Minor = 1 pt, **need 14** to pass. See `POINTS.md`.

## Demo logins

| Email | Password | Browser |
|-------|----------|---------|
| `alex@example.com` | `testpass123` | left window |
| `carlito@example.com` | `12345678` | right window |

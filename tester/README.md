# ft_transcendence — Eval Sheet Tester

One command runs **every** check from the 42 eval sheet. Chrome **opens a window
with DevTools**, clicks through the app with a HUD overlay, then opens a
**second Chrome window** so two users act at the same time.

## Quick start

```bash
make                 # deploy
./tester/run.sh      # run everything (two Chrome windows + DevTools)
```

Read the last run:

```bash
cat tester/results/latest/summary.txt
cat tester/results/latest/failures.md    # copy-paste repro for each FAIL
```

## Commands

| Command | What it does |
|---------|----------------|
| `./tester/run.sh` | **All suites.** Visible Chrome + DevTools. Two users. |
| `./tester/run.sh --headless` | Same tests, no window |
| `./tester/run.sh --fast` | Skip slow rate-limit burst |
| `./tester/run.sh --list` | List suites |
| `./tester/run.sh events social browser` | Run matching suites only |
| `make test-eval` | Same as `./tester/run.sh` |

Watch only the browsers:

```bash
node tester/browser/check.js              # public pages + journey + two users
node tester/browser/user-journey.js       # Alex only
node tester/browser/multi-user.js         # Alex + Carlito, two windows
TESTER_HEADLESS=1 node tester/browser/check.js
```

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
| `20_modules` | All 20 claimed module points |
| `99_manual` | Live defense checklist (human) |

## Module scoring

Major = 2 pts, Minor = 1 pt, **need 14** to pass. See `POINTS.md`.

## Demo logins

| Email | Password | Browser |
|-------|----------|---------|
| `alex@example.com` | `testpass123` | left window |
| `carlito@example.com` | `12345678` | right window |

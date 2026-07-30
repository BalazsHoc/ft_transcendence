# Club Profile Screen — Task Spec

**Developer:** Pouya  
**Inspiration:** `frontend inspirations/frontend inspirations/velo_vienna_desktop_profile/`  
**Base branch:** `feature/discover-page`  
**Working branch:** `feature/club-profile`  
**Constraint:** Frontend only — do **not** change backend or unrelated UI (Header, Discover, Profile, Map, etc.) except the minimal route wiring needed.

---

## 1. What this screen is

A **Club Profile** page (demo: “Velo Vienna”), matching the Velo Vienna inspiration layout:

1. **Hero** — cover image + floating glass card (sport/city badges, name, description, Apply / View Schedule)
2. **Stats row** — Active Members, Club Score, Established
3. **Main bento** — Upcoming Rides (left) + Recruiting + Member Spotlight (right)

Header already links to `/clubs`. Today that URL hits **NotFound**. This task makes `/clubs` show the club profile.

---

## 2. Subject (`en.subject_transcendence.pdf` / `POINTS.md`) — respect these

Clubs are **not** a scored major/minor module in POINTS.md. The product vision (`DEV.md`) lists club management as **future**. This screen must still respect the subject:

| Subject rule | How this task respects it |
|---|---|
| Framework FE + BE already chosen | Stay on React/TS + Django stack — no new forbidden stacks |
| Social / profiles / interaction | Club UI is presentation over existing Users + Events; Apply/RSVP map to existing join patterns where possible |
| i18n (3 languages) | All visible text via `t("club.…")` in `en` / `de` / `ua` |
| Dark/Light theme | CSS variables from `global.css` only — no hardcoded inspiration palette |
| Public API / ORM / WS | **Do not add** club backend; do not invent new API endpoints |
| Map / chat / auth | Do not modify those modules |

**Forbidden for this task:** editing `backend/**`, adding a Club model, changing other people’s pages beyond adding a route.

---

## 3. Backend reality (read-only findings)

There is **no** Club app, model, serializer, or `/api/clubs/`.

| Exists | Does not exist |
|---|---|
| User, Event, EventParticipant, Message, Geo | Club, ClubMember, ClubScore |
| `GET /api/events/?sport=cycling` | Join club / recruit / club spotlight APIs |
| Join/leave **event** | Club membership |

### Data strategy for MVP

| UI block | Source |
|---|---|
| Club name, blurb, cover, tags, stats, recruiting, spotlight | **Fake / hardcoded** via i18n + constants (same pattern as Curated for You / ProfileScoreCard) |
| Upcoming Rides | Prefer `getEvents({ sport: "cycling" })`; if empty/error, fall back to 2 fake rides |
| Apply to Join / Apply as Ride Leader | UI-only for now (no backend) — buttons render, no fake network |
| RSVP | If ride has a real `eventId`, call `joinEvent(id)`; fake rides do nothing harmful |

“Club” = **frontend persona** over events filtered by sport until a real Club model exists.

---

## 4. Design compatibility with current UI

| Inspiration | Project mapping |
|---|---|
| Inter / Hanken Grotesk | Already in `global.css` (`font-display`) |
| Soft blue chips / date boxes | Use `--surface`, `--bg`, `--muted`, `--surface-border` — not Stitch hex colors |
| Black primary buttons | Existing `Button` `primary` / `outline` / `secondary` |
| Pill tags | Existing `Badge` |
| Glass hero card | Same idea as `ProfileHero` / `FeaturedEventCard` (surface + blur + CSS vars) |
| Rounded cards | `rounded-3xl` + `border-[var(--surface-border)]` like Profile bento |

Do **not** copy Material Symbols CDN or inspiration HTML as-is. Use `lucide-react` like the rest of the app.

---

## 5. Reuse vs create

### Reuse (do not rebuild)

| Component | Use for |
|---|---|
| `Button` | Apply to Join, View Schedule, RSVP, Apply as Ride Leader, See All |
| `Badge` | Sport / city pills on hero |
| `resolveMediaUrl` / `DEFAULT_*` | Images |
| App `Header` / `Footer` / `AppLayout` | Already wrap pages — do not rewrite Header |

### Create (club-only, small pieces)

```text
frontend/src/pages/ClubPage.tsx
frontend/src/components/club/
  CLUB.md
  ClubHero.tsx
  ClubStatCard.tsx          # one reusable stat tile (used 3×)
  ClubStatsRow.tsx
  ClubRideRow.tsx           # one ride row (mapped)
  ClubUpcomingRides.tsx
  ClubRecruitingCard.tsx
  ClubMemberSpotlight.tsx
```

### Minimal shared wiring (allowed)

- `App.tsx` — add route `clubs` → `ClubPage`
- `en.json` / `de.json` / `ua.json` — `club.*` keys
- `global.css` — club layout helpers only (CSS variables)

### Do not touch

- `backend/**`
- Header / HeaderNav / Discover / Profile / Map / Landing components (except route)
- Existing discover/profile files

---

## 6. Page structure

```text
ClubPage
├── ClubHero
├── ClubStatsRow
│   └── ClubStatCard × 3
└── club-bento grid
    ├── ClubUpcomingRides
    │   └── ClubRideRow × N
    └── sidebar
        ├── ClubRecruitingCard
        └── ClubMemberSpotlight
```

Build order: cards → sections → page → route (same as Discover/Profile docs).

---

## 7. Acceptance checklist

- [x] Route `/clubs` renders club profile (Clubs nav works)
- [x] Layout matches inspiration sections (hero, stats, rides, recruiting, spotlight)
- [x] No hardcoded visible English in JSX — all `t("club.…")`
- [x] No hardcoded theme colors — CSS variables only
- [x] Uses `Button` + `Badge` — no raw styled `<button>` for CTAs
- [x] Backend untouched
- [x] Header/Discover/Profile/Map files untouched
- [x] Dark mode readable (CSS variables)
- [x] Responsive: stacks on mobile, bento on desktop
- [x] `CLUB.md` documents ownership
- [ ] Commit messages `FEAT:` / `UI:` style, no Cursor co-author trailer (pending push)

---

## 10. Review log

### Review 1
- Fixed `useRef` typing on `ClubPage`
- Added meaningful `alt` on hero/spotlight images
- Confirmed no club TS errors

### Review 2
- Simplified hero gradient (removed `color-mix` for broader browser support)
- Confirmed no raw `<button>` / hex colors in club files
- Confirmed forbidden paths untouched

### Review 3
- Full file audit vs §5 reuse/create list — matches
- Data strategy matches §3 (fake identity + optional cycling events + RSVP via `joinEvent`)
- Ready for local preview at `/clubs`

---

## 8. Out of scope (later)

- Real Club CRUD API
- Multi-club directory listing
- Wiring Header “Join Club” to this page (would edit Header — avoid for conflict safety)
- Community page (`/community`)

---

## 9. Review loops

After implementation, review against this file **3 times** and fix gaps before considering the task done.

# Club Profile — Complete Code Walkthrough (Beginner Guide)

This document explains **everything we added** for the Club screen, in the order that makes it easiest to understand.

Read it slowly, top to bottom. You do **not** need to memorize React first — each section explains the idea in plain language, then shows the code.

---

## 0. Big picture in 30 seconds

When you click **Clubs** in the header, the browser goes to:

```text
http://localhost:5173/clubs
```

React Router looks in `App.tsx`, finds the route `clubs`, and renders **`ClubPage`**.

`ClubPage` is like a **table of contents**. It does not draw every detail itself. It stacks smaller pieces:

```text
ClubPage
├── ClubHero              (cover photo + name + buttons)
├── ClubStatsRow          (3 numbers: members / score / year)
│   └── ClubStatCard × 3
└── grid
    ├── ClubUpcomingRides (list of rides)
    │   └── ClubRideRow × N
    ├── ClubRecruitingCard
    └── ClubMemberSpotlight
```

**Important fact:** the backend has **no Club API**. So club name, stats, recruiting, and spotlight are **fake demo data** (from translation files). Rides try to load real cycling **events** from the API; if that fails, we show demo rides.

---

## 1. Words you need (mini dictionary)

| Word | Meaning |
|------|---------|
| **Component** | A reusable UI building block (a function that returns HTML-like JSX) |
| **Page** | A special component shown for one URL (like `/clubs`) |
| **Props** | Inputs passed into a component (like arguments to a function) |
| **State** | Data that can change while the page is open (e.g. loading rides) |
| **i18n / `t()`** | Translation helper. `t("club.hero.name")` looks up text in JSON files |
| **CSS variables** | Theme colors like `var(--text)`, `var(--surface)` so dark/light mode works |
| **Reuse** | Use a component that already exists instead of inventing a new button style |

---

## 2. What already existed (we reused these)

We did **not** reinvent buttons, badges, routing, or the header.

| Existing thing | Path | How we used it |
|----------------|------|----------------|
| **Button** | `components/shared/Button.tsx` | Apply to Join, View Schedule, RSVP, Apply as Ride Leader |
| **Badge** | `components/shared/Badge.tsx` | Sport/city pills, intensity label on rides |
| **Header + nav** | `components/layout/Header*.tsx` | Already had a link to `/clubs` — we only made that URL work |
| **AppLayout** | `layouts/AppLayout.tsx` | Wraps every page with header/footer |
| **react-router** | already in app | Maps URL → page |
| **react-i18next** | already in app | `useTranslation()` + `t()` |
| **lucide-react** | already in app | Icons (MapPin, Clock, Users, …) |
| **getEvents / joinEvent** | `api/eventsApi.ts` | Load cycling events; RSVP joins a real event |
| **EventItem type** | `types/api.ts` | TypeScript shape of an event from the API |
| **resolveMediaUrl** | `utils/media.ts` | Safe image URL + fallback if image missing |
| **DEFAULT_EVENT_IMAGE_SRC / DEFAULT_AVATAR_SRC** | `utils/media.ts` | Placeholder images |
| **CSS theme tokens** | `styles/global.css` | `--text`, `--muted`, `--surface`, `--bg`, … |
| **discover.* level keys** | `i18n` | Translate event level (beginner, …) for ride rows |

---

## 3. What we created (new files)

| New file | Role |
|----------|------|
| `pages/ClubPage.tsx` | The page for `/clubs` — data + layout |
| `components/club/ClubHero.tsx` | Top cover + club info + CTAs |
| `components/club/ClubStatCard.tsx` | One stat tile (reusable) |
| `components/club/ClubStatsRow.tsx` | Row of 3 stats |
| `components/club/ClubRideRow.tsx` | One ride line + RSVP |
| `components/club/ClubUpcomingRides.tsx` | Section that lists rides |
| `components/club/ClubRecruitingCard.tsx` | “Looking for ride leaders” card |
| `components/club/ClubMemberSpotlight.tsx` | Member quote card |
| `components/club/CLUB.md` | Short ownership map for the team |
| `i18n/.../en.json` (+ de + ua) | All `club.*` texts |
| `styles/global.css` (small addition) | Full-width club page layout |
| `app/App.tsx` (one line change) | Route `clubs` → `ClubPage` |

Branch: **`feature/club-profile`** (created from `feature/discover-page`).

---

## 4. Step A — Connect the URL (App.tsx)

### What we changed

Only **two** things in `App.tsx`:

1. Import `ClubPage`
2. Add `<Route path="clubs" element={<ClubPage />} />`

### Full relevant code

```tsx
import { ClubPage } from "../pages/ClubPage";

// inside <Routes>:
<Route path="clubs" element={<ClubPage />} />
```

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| — (no new component here) | `Route`, `Routes` from react-router |
| | `ClubPage` (our new page) |
| | `AppLayout` (already wrapping routes) |

### Why this matters

Before this line, `/clubs` fell into `path="*"` → **Not Found**.  
After this line, `/clubs` shows our club screen. The header link already pointed here — we did not edit the Header (to avoid conflicts with teammates).

---

## 5. Step B — Translations (i18n)

### Idea

Never write English text directly in JSX like `<h1>Velo Vienna</h1>`.  
Instead write `<h1>{t("club.hero.name")}</h1>` and put the real words in JSON files.

We added a `"club": { ... }` block to:

- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/de.json`
- `frontend/src/i18n/locales/ua.json` (English placeholders OK for now)

### Example (English)

```json
"club": {
  "hero": {
    "name": "Velo Vienna",
    "description": "A modern syndicate for the urban cyclist...",
    "sport": "Cycling",
    "city": "Vienna, AT",
    "applyToJoin": "Apply to Join",
    "viewSchedule": "View Schedule"
  },
  "stats": { "...": "..." },
  "rides": { "...": "..." },
  "recruiting": { "...": "..." },
  "spotlight": { "...": "..." }
}
```

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| New keys under `"club"` | i18n system already configured |
| | `useTranslation` / `t()` in components |

---

## 6. Step C — Global CSS (tiny layout fix)

### Idea

Profile page already uses a full-width layout (cover photo edge to edge).  
Club page needs the same, so the cover is not stuck inside a narrow box.

### Code we added in `global.css`

```css
.page-container:has(.club-page) {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 0;
}

.club-page {
  width: 100%;
}
```

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| `.club-page` rules | Same pattern as `.profile-page-full` |
| | CSS variables used inside components (`--text`, etc.) |

---

## 7. Step D — Smallest piece: `ClubStatCard`

### Idea

One metric: icon + big number + label.  
We build it **once**, then use it **three times**.

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| `ClubStatCard` | Icons from `lucide-react` (`Users`, `Award`, `History`) |
| | CSS variables for colors |

### Full code

```tsx
import type { LucideIcon } from "lucide-react";
import { Users, Award, History } from "lucide-react";

type ClubStatCardProps = {
  icon: LucideIcon;
  value: string;
  label: string;
};

export function ClubStatCard({ icon: Icon, value, label }: ClubStatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--text)]">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold text-[var(--text)]">
          {value}
        </p>
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}

export const CLUB_STAT_ICONS = {
  members: Users,
  score: Award,
  established: History,
} as const;
```

**Beginner tip:** `icon: Icon` renames the prop so we can write `<Icon />` as a component.

---

## 8. Step E — `ClubStatsRow` (uses ClubStatCard × 3)

### Created vs used

| Created | Used |
|---------|------|
| `ClubStatsRow` | **Our** `ClubStatCard` |
| | `useTranslation` / `t()` |

### Full code

```tsx
import { useTranslation } from "react-i18next";
import { ClubStatCard, CLUB_STAT_ICONS } from "./ClubStatCard";

type ClubStatsRowProps = {
  members: string;
  score: string;
  established: string;
};

export function ClubStatsRow({ members, score, established }: ClubStatsRowProps) {
  const { t } = useTranslation();

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3">
      <ClubStatCard
        icon={CLUB_STAT_ICONS.members}
        value={members}
        label={t("club.stats.activeMembers")}
      />
      <ClubStatCard
        icon={CLUB_STAT_ICONS.score}
        value={score}
        label={t("club.stats.clubScore")}
      />
      <ClubStatCard
        icon={CLUB_STAT_ICONS.established}
        value={established}
        label={t("club.stats.established")}
      />
    </section>
  );
}
```

On mobile: 1 column. From `sm` breakpoint up: 3 columns.

---

## 9. Step F — `ClubHero`

### Idea

Looks like the **Profile** hero (not the original centered inspiration):

1. Full-width cover photo  
2. A card overlapping the bottom (`-mt-16`) with title, badges, description  
3. Buttons on the right on desktop  

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| `ClubHero` | `Badge` |
| | `Button` |
| | `MapPin` icon |
| | `resolveMediaUrl`, `DEFAULT_EVENT_IMAGE_SRC` |
| | `useTranslation` |

### Full code

```tsx
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../shared/Badge";
import Button from "../shared/Button";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type ClubHeroProps = {
  coverImage?: string;
  name: string;
  description: string;
  sportLabel: string;
  cityLabel: string;
  onApply?: () => void;
  onViewSchedule?: () => void;
};

export function ClubHero({
  coverImage,
  name,
  description,
  sportLabel,
  cityLabel,
  onApply,
  onViewSchedule,
}: ClubHeroProps) {
  const { t } = useTranslation();
  const imageUrl = resolveMediaUrl(coverImage, DEFAULT_EVENT_IMAGE_SRC);

  return (
    <div>
      <div className="relative h-[240px] w-full overflow-hidden rounded-b-3xl bg-[var(--surface-border)] md:h-[280px]">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/45 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-16 flex max-w-6xl flex-col gap-6 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl md:-mt-20 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>{sportLabel}</Badge>
            <Badge variant="solid">{cityLabel}</Badge>
          </div>

          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {name}
          </h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin size={16} aria-hidden="true" />
            {cityLabel}
          </p>

          <p className="mt-4 max-w-2xl text-sm text-[var(--muted)] md:text-base">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <Button variant="primary" onClick={onApply}>
            {t("club.hero.applyToJoin")}
          </Button>
          <Button variant="outline" onClick={onViewSchedule}>
            {t("club.hero.viewSchedule")}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Props explained:**

- `onApply` / `onViewSchedule` — optional click handlers from the parent page  
- Parent passes translated strings for name/description so the hero stays “dumb” (display only)

---

## 10. Step G — `ClubRideRow`

### Idea

One line in the rides list: date | title + time + badge | RSVP button.

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| `ClubRideRow` | `Button` |
| Type `ClubRideItem` | `Badge` |
| | `Clock` icon |
| | `t("club.rides.rsvp")` |

### Full code

```tsx
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";

export type ClubRideItem = {
  id: string;
  title: string;
  day: string;
  month: string;
  timeLabel: string;
  intensityLabel: string;
  eventId?: string; // only set for real API events
};

type ClubRideRowProps = {
  ride: ClubRideItem;
  onRsvp?: (ride: ClubRideItem) => void;
  rsvpDisabled?: boolean;
};

export function ClubRideRow({ ride, onRsvp, rsvpDisabled }: ClubRideRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--surface-border)] py-5 last:border-b-0 sm:flex-row sm:items-center">
      {/* date column + title */}
      {/* ... */}
      <Button
        variant="outline"
        size="sm"
        disabled={rsvpDisabled}
        onClick={() => onRsvp?.(ride)}
      >
        {t("club.rides.rsvp")}
      </Button>
    </div>
  );
}
```

**Beginner tip:** `onRsvp?.(ride)` means “call only if `onRsvp` was provided”.

---

## 11. Step H — `ClubUpcomingRides`

### Idea

Section box with title + “See All” link + list of `ClubRideRow`.

### Created vs used

| Created | Used |
|---------|------|
| `ClubUpcomingRides` | **Our** `ClubRideRow` |
| | `Link` from react-router (goes to `/discover`) |
| | `ArrowRight` icon |
| | `t()` |

### Key pattern: `.map()`

```tsx
{rides.map((ride) => (
  <ClubRideRow key={ride.id} ride={ride} onRsvp={onRsvp} />
))}
```

Build **one** row component, repeat it for every ride. Same idea as Discover’s curated cards.

Also handles:

- `loading` → show “Loading…”
- empty list → show “No upcoming rides”

---

## 12. Step I — `ClubRecruitingCard`

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| `ClubRecruitingCard` | `Button` |
| | `Megaphone` icon |
| | `t("club.recruiting.*")` |

UI-only for now (no backend for “apply as ride leader”).

---

## 13. Step J — `ClubMemberSpotlight`

### Created vs used

| Created | Used (existing) |
|---------|-----------------|
| `ClubMemberSpotlight` | `resolveMediaUrl`, `DEFAULT_AVATAR_SRC` |
| | `t("club.spotlight.title")` |
| | name / subtitle / quote passed as props (from parent’s `t()`) |

If the avatar image fails to load, `onError` swaps to the default avatar.

---

## 14. Step K — The page brain: `ClubPage.tsx`

This is the most important file to understand.

### Created vs used

| Created | Used |
|---------|------|
| `ClubPage` | All our club components above |
| Helper `eventToRide` | Existing `getEvents`, `joinEvent` |
| Helper `levelLabel` | Existing `EventItem` type |
| | `useState`, `useEffect`, `useRef` (React) |
| | `useTranslation` |

### What the page does, step by step

1. **State**
   - `rides` — list to show  
   - `loading` — true while fetching  

2. **`useEffect` on load / language change**
   - Try `getEvents({ sport: "cycling" })`  
   - If events exist → convert to `ClubRideItem`  
   - If empty or error → use **fallback demo rides** from `t("club.rides.demo…")`  

3. **`scrollToRides`**
   - “View Schedule” scrolls to the rides section (`ridesRef`)  

4. **`handleRsvp`**
   - If the ride has a real `eventId`, call `joinEvent`  
   - Demo rides have no `eventId` → button does nothing harmful  

5. **Render**
   - Compose hero + stats + rides + sidebar  

### Full code (current)

```tsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClubHero } from "../components/club/ClubHero";
import { ClubStatsRow } from "../components/club/ClubStatsRow";
import { ClubUpcomingRides } from "../components/club/ClubUpcomingRides";
import { ClubRecruitingCard } from "../components/club/ClubRecruitingCard";
import { ClubMemberSpotlight } from "../components/club/ClubMemberSpotlight";
import type { ClubRideItem } from "../components/club/ClubRideRow";
import { getEvents, joinEvent } from "../api/eventsApi";
import type { EventItem } from "../types/api";

// cover + spotlight image URLs (demo constants)
// ...

function levelLabel(level: EventItem["level"], t: (key: string) => string) {
  const key = `discover.${level}` as const;
  const translated = t(key);
  return translated === key ? level : translated;
}

function eventToRide(event: EventItem, locale: string, t: (key: string) => string): ClubRideItem {
  const start = new Date(event.start_at);
  return {
    id: event.id,
    eventId: event.id,
    title: event.title,
    day: start.toLocaleDateString(locale, { day: "numeric" }),
    month: start.toLocaleDateString(locale, { month: "short" }),
    timeLabel: start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    intensityLabel: levelLabel(event.level, t),
  };
}

export function ClubPage() {
  const { t, i18n } = useTranslation();
  const ridesRef = useRef<HTMLDivElement | null>(null);
  const [rides, setRides] = useState<ClubRideItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // load cycling events OR fallback demos
    // ...
  }, [i18n.language, t]);

  function scrollToRides() {
    ridesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleRsvp(ride: ClubRideItem) {
    if (!ride.eventId) return;
    try {
      await joinEvent(ride.eventId);
    } catch {
      // quiet for MVP
    }
  }

  return (
    <div className="club-page">
      <ClubHero
        coverImage={CLUB_COVER_IMAGE}
        name={t("club.hero.name")}
        description={t("club.hero.description")}
        sportLabel={t("club.hero.sport")}
        cityLabel={t("club.hero.city")}
        onViewSchedule={scrollToRides}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-8">
        <ClubStatsRow
          members={t("club.stats.membersValue")}
          score={t("club.stats.scoreValue")}
          established={t("club.stats.establishedValue")}
        />

        <div ref={ridesRef} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ClubUpcomingRides rides={rides} loading={loading} onRsvp={handleRsvp} />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <ClubRecruitingCard />
            <ClubMemberSpotlight
              name={t("club.spotlight.name")}
              subtitle={t("club.spotlight.subtitle")}
              quote={t("club.spotlight.quote")}
              avatarUrl={SPOTLIGHT_AVATAR}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

Open the real file for every line:  
`frontend/src/pages/ClubPage.tsx`

---

## 15. Data flow diagram (how pieces talk)

```text
User opens /clubs
        │
        ▼
   App.tsx Route
        │
        ▼
     ClubPage
        │
        ├── t("club…") ──────────────► en.json / de.json / ua.json
        │
        ├── getEvents(cycling) ──────► Backend /api/events/
        │         │
        │         ├── success → rides state
        │         └── fail/empty → demo rides from t()
        │
        ├── ClubHero ◄── strings + cover URL
        ├── ClubStatsRow ◄── fake numbers from t()
        │       └── ClubStatCard × 3
        ├── ClubUpcomingRides ◄── rides + loading
        │       └── ClubRideRow × N
        │               └── RSVP → joinEvent (if eventId)
        ├── ClubRecruitingCard
        └── ClubMemberSpotlight
```

---

## 16. Master table — every file

| File | Created? | Reuses |
|------|----------|--------|
| `App.tsx` | Modified (1 route) | Router, AppLayout |
| `ClubPage.tsx` | **Yes** | Club* components, eventsApi, i18n, React hooks |
| `ClubHero.tsx` | **Yes** | Button, Badge, media utils, lucide |
| `ClubStatCard.tsx` | **Yes** | lucide icons |
| `ClubStatsRow.tsx` | **Yes** | ClubStatCard, i18n |
| `ClubRideRow.tsx` | **Yes** | Button, Badge, lucide |
| `ClubUpcomingRides.tsx` | **Yes** | ClubRideRow, Link, lucide |
| `ClubRecruitingCard.tsx` | **Yes** | Button, lucide |
| `ClubMemberSpotlight.tsx` | **Yes** | media utils, i18n |
| `CLUB.md` | **Yes** | — (docs only) |
| `en/de/ua.json` | Modified | existing i18n files |
| `global.css` | Modified | existing theme variables |
| Backend | **No** | untouched on purpose |

---

## 17. How to run and see it

```bash
# terminal 1
cd backend && source .venv/bin/activate
daphne -b 127.0.0.1 -p 8000 core.asgi:application

# terminal 2
cd frontend && npm run dev
```

Open: **http://localhost:5173/clubs**  
Or click **Clubs** in the header.

Switch language EN / DE / UA — club texts should change.

---

## 18. What we deliberately did NOT do

| Not done | Why |
|----------|-----|
| Backend Club model | Subject/MVP has no clubs API; avoid conflicts |
| Edit Header / Discover / Profile | Teammates own those files |
| Copy inspiration HTML 1:1 | Design should match **our** Profile/Discover look |
| Real “Apply to Join” API | No endpoint yet — button is UI-ready |

---

## 19. Suggested reading order (if you feel lost)

1. This section 0–3 (big picture)  
2. `CLUB.md` (short map)  
3. `ClubStatCard.tsx` (smallest)  
4. `ClubHero.tsx` (visual)  
5. `ClubRideRow` + `ClubUpcomingRides` (list + map)  
6. `ClubPage.tsx` (how data connects)  
7. `App.tsx` route line  

---

## 20. Related docs in `.local/`

| File | Purpose |
|------|---------|
| `CLUB_PROFILE_TASK.md` | Task rules, subject, acceptance checklist |
| `CLUB_PROFILE_CODE_WALKTHROUGH.md` | **This file** — learn the code |
| `CURATED_FOR_YOU_TASK.md` | Your earlier Discover task |
| `SETUP.md` | How to run the project |

---

You now have a full map of **every new piece**, **every reused piece**, and **how `/clubs` becomes a working screen**. If one file still feels confusing, open that file next to this doc and match section → code line by line.

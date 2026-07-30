# Curated for You — Task Documentation

**Developer:** Pouya  
**Branch:** `feature/discover-curated-for-you`  
**Base branch:** `feature/discover-page` (Mina)  
**Task:** Developer B — "Curated for You" section (from `TASKS.md`)

---

## Summary

Built the **Curated for You** section for the Discover page:

1. Shared `Badge` component (Mina approved creating it)
2. `FeaturedEventCard` — one large featured event card
3. `CuratedEventCard` — smaller side cards (reused via `.map()`)
4. `CuratedForYouSection` — section heading + layout + fake demo data
5. Translation keys (EN / DE / UA)
6. Section layout styles in `global.css`

**Not done (lead's job later):**
- `DiscoverMain.tsx`
- Wiring into `DiscoverPage.tsx`
- Real API data (fake hardcoded data for now)

---

## Git commits

| Commit | Message | Pushed |
|--------|---------|--------|
| `219fde3` | `FEAT: add shared Badge component for discover event cards` | Yes |
| `fd74df5` | `FEAT: add Curated for You section components` | No (local only) |

---

## Step-by-step what was done

### Step 0 — Setup

- Checked out `feature/discover-page`
- Created branch `feature/discover-curated-for-you`
- Read `TASKS.md` and `DISCOVER.md`

### Step 1 — `Badge.tsx` (prerequisite)

Mina confirmed to create the shared pill/tag component.

**File:** `frontend/src/components/shared/Badge.tsx`  
**Purpose:** Reusable rounded label chips for all Discover cards (used by me and Balazs).

### Step 2 — `FeaturedEventCard.tsx`

**File:** `frontend/src/components/discover/FeaturedEventCard.tsx`  
**Purpose:** One large card with background image, 2 badges, title, description, Join Group button, member count.

Visual reference: `BentoImageCard.tsx` (large size).

### Step 3 — `CuratedEventCard.tsx`

**File:** `frontend/src/components/discover/CuratedEventCard.tsx`  
**Purpose:** Smaller card with image, one badge, title, time/date line.

Visual reference: `BentoImageCard.tsx` (small size).

### Step 4 — `CuratedForYouSection.tsx`

**File:** `frontend/src/components/discover/CuratedForYouSection.tsx`  
**Purpose:** Section title + 1 featured card + 2 small cards from hardcoded array.

Also updated:
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/de.json`
- `frontend/src/i18n/locales/ua.json`
- `frontend/src/styles/global.css`

---

## Files created (full code)

### 1. `frontend/src/components/shared/Badge.tsx`

```tsx
type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "live" | "solid";
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantClasses = {
    default:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--surface-border)]",
    live: "bg-red-600 text-white",
    solid: "bg-[var(--text)] text-[var(--surface)]",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
```

---

### 2. `frontend/src/components/discover/FeaturedEventCard.tsx`

```tsx
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type FeaturedEventCardProps = {
  image: string;
  title: string;
  description: string;
  levelLabel: string;
  memberCount: number;
  onJoin?: () => void;
  className?: string;
};

export function FeaturedEventCard({
  image,
  title,
  description,
  levelLabel,
  memberCount,
  onJoin,
  className = "",
}: FeaturedEventCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC);

  return (
    <article
      className={`relative min-h-[320px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/10 p-8 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{t("discover.featuredClub")}</Badge>
          <Badge>{levelLabel}</Badge>
        </div>

        <h3 className="mb-2 font-display text-2xl font-semibold text-white">
          {title}
        </h3>

        <p className="mb-6 text-sm text-white/80">{description}</p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="secondary" onClick={onJoin}>
            {t("discover.joinGroup")}
          </Button>

          <div className="flex items-center gap-2 text-sm text-white/90">
            <Users size={18} aria-hidden="true" />
            <span>{t("discover.members", { count: memberCount })}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
```

---

### 3. `frontend/src/components/discover/CuratedEventCard.tsx`

```tsx
import { Badge } from "../shared/Badge";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type CuratedEventCardProps = {
  image: string;
  title: string;
  categoryLabel: string;
  timeLabel: string;
  className?: string;
};

export function CuratedEventCard({
  image,
  title,
  categoryLabel,
  timeLabel,
  className = "",
}: CuratedEventCardProps) {
  const imageUrl = resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC);

  return (
    <article
      className={`relative min-h-[200px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <Badge className="mb-3">{categoryLabel}</Badge>

        <h3 className="font-display text-lg font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm text-white/80">{timeLabel}</p>
      </div>
    </article>
  );
}
```

---

### 4. `frontend/src/components/discover/CuratedForYouSection.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { CuratedEventCard } from "./CuratedEventCard";
import { FeaturedEventCard } from "./FeaturedEventCard";
import { DEFAULT_EVENT_IMAGE_SRC } from "../../utils/media";

export function CuratedForYouSection() {
  const { t } = useTranslation();

  const curatedEvents = [
    {
      id: "morning-flow",
      image: DEFAULT_EVENT_IMAGE_SRC,
      title: t("discover.curatedEventOneTitle"),
      categoryLabel: t("discover.yoga"),
      timeLabel: t("discover.curatedEventOneTime"),
    },
    {
      id: "strength-conditioning",
      image: DEFAULT_EVENT_IMAGE_SRC,
      title: t("discover.curatedEventTwoTitle"),
      categoryLabel: t("discover.strength"),
      timeLabel: t("discover.curatedEventTwoTime"),
    },
  ];

  return (
    <section className="curated-for-you">
      <h2 className="curated-for-you__title">{t("discover.curatedForYou")}</h2>

      <div className="curated-for-you__grid">
        <FeaturedEventCard
          image={DEFAULT_EVENT_IMAGE_SRC}
          title={t("discover.featuredEventTitle")}
          description={t("discover.featuredEventDescription")}
          levelLabel={t("discover.intermediate")}
          memberCount={128}
        />

        <div className="curated-for-you__side">
          {curatedEvents.map((event) => (
            <CuratedEventCard
              key={event.id}
              image={event.image}
              title={event.title}
              categoryLabel={event.categoryLabel}
              timeLabel={event.timeLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Files changed (additions only)

### 5. `frontend/src/i18n/locales/en.json` — keys added under `"discover"`

```json
"strength": "Strength",
"featuredEventTitle": "Vienna River Run Collective",
"featuredEventDescription": "Casual group runs along the Danube every weekend.",
"curatedEventOneTitle": "Morning Flow & Focus",
"curatedEventOneTime": "Sat, 8:00 AM",
"curatedEventTwoTitle": "Strength & Conditioning",
"curatedEventTwoTime": "Sun, 6:00 PM"
```

### 6. `frontend/src/i18n/locales/de.json` — keys added under `"discover"`

```json
"strength": "Krafttraining",
"featuredEventTitle": "Vienna River Run Collective",
"featuredEventDescription": "Lockere Gruppenläufe entlang der Donau jedes Wochenende.",
"curatedEventOneTitle": "Morning Flow & Focus",
"curatedEventOneTime": "Sa, 8:00 Uhr",
"curatedEventTwoTitle": "Strength & Conditioning",
"curatedEventTwoTime": "So, 18:00 Uhr"
```

### 7. `frontend/src/i18n/locales/ua.json` — keys added under `"discover"`

```json
"happeningNow": "Happening Now",
"curatedForYou": "Curated for You",
"joinGroup": "Join Group",
"members": "{{count}} Members",
"liveMatch": "Live Match",
"sessionStarted": "Session Started",
"featuredClub": "Featured Club",
"strength": "Strength",
"featuredEventTitle": "Vienna River Run Collective",
"featuredEventDescription": "Casual group runs along the Danube every weekend.",
"curatedEventOneTitle": "Morning Flow & Focus",
"curatedEventOneTime": "Sat, 8:00 AM",
"curatedEventTwoTitle": "Strength & Conditioning",
"curatedEventTwoTime": "Sun, 6:00 PM"
```

(Ukrainian left in English per team guideline — `@oshcheho` will translate later.)

---

### 8. `frontend/src/styles/global.css` — section layout added

```css
.curated-for-you {
  margin-top: 40px;
}

.curated-for-you__title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.curated-for-you__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 1024px) {
  .curated-for-you__grid {
    grid-template-columns: 2fr 1fr;
  }
}

.curated-for-you__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

---

## Reused existing components (did not create)

| Component | File | Used for |
|-----------|------|----------|
| `Button` | `components/shared/Button.tsx` | "Join Group" on featured card |
| `Badge` | `components/shared/Badge.tsx` | Category/level pills |
| `resolveMediaUrl` | `utils/media.ts` | Image fallback |
| `BentoImageCard` | `components/landing/BentoImageCard.tsx` | Visual layout reference only |

---

## TASKS.md checklist

- [x] No raw `<button>` — used `Button`
- [x] No custom pill markup — used `Badge`
- [x] No hardcoded visible text — all via `t("discover.…")`
- [x] No hardcoded theme colors — CSS variables in `global.css`
- [x] Cards built once, reused with `.map()`
- [x] Did not touch `DiscoverPage.tsx` or `DiscoverMain.tsx`
- [x] Did not touch Developer A files (`LiveEventCard`, `HappeningNowSection`)

---

## Layout structure

```
CuratedForYouSection
├── h2  "Curated for You"
└── grid
    ├── FeaturedEventCard        (big card, left)
    └── curated-for-you__side
        ├── CuratedEventCard     (small card 1)
        └── CuratedEventCard     (small card 2)
```

---

## How to run and test (after lead integrates)

Until Mina wires `<CuratedForYouSection />` into the Discover page, the section is not visible in the browser.

**Backend:**
```bash
cd backend && source .venv/bin/activate
daphne -b 127.0.0.1 -p 8000 core.asgi:application
```

**Frontend:**
```bash
cd frontend && npm run dev
```

Open: http://localhost:5173

---

## Still to do

- [ ] Push commit `fd74df5` to GitHub
- [ ] Open PR from `feature/discover-curated-for-you`
- [ ] Wait for lead to integrate into `DiscoverPage.tsx`
- [ ] Replace fake data with real API later (separate task)

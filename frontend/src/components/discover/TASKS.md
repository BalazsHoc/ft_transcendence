# Discover Page — Task Split

## Already done — what exists before you start

Read this first. These are already built, already reviewed, and already
match the mockup — nobody on this task needs to rebuild any of it, only
**import and reuse** it.

```text
components/layout/
  Header.tsx              top bar — composes everything below it
    HeaderBrand.tsx       site logo/name, links back home
    HeaderNav.tsx         main menu links (Discover, Clubs, Map, Community)
    HeaderSearch.tsx      the search input box
    HeaderUserMenu.tsx    logged in: avatar + name + logout
                          logged out: plain profile icon
  Sidebar.tsx             filter panel on the left of the Discover page
    (renders FilterGroup 3 times, see below)

components/discover/
  FilterGroup.tsx         ONE reusable filter block, reused 3x by Sidebar:
                          Categories (chips), Level (checkboxes), Time (radio)

components/shared/
  Button.tsx              button WITH text — variants: primary, secondary,
                          outline, danger, glass, indigo
                          (used in Header for "Join Club" and "Logout")
  IconButton.tsx          button that is ONLY an icon, no text — requires
                          an aria-label prop
                          (used in Header for the bell + dark mode toggle)
  Badge.tsx               pill/tag label — variants: default, live, solid
                          (being built now, before this task starts —
                          see "Prerequisite" below)
  LanguageSwitcher.tsx    the language dropdown (EN/DE/UA)
```

**The one rule that matters most: `Button`, `IconButton`, and `Badge` are
the only building blocks either developer should use for buttons and
tags/pills in their new components. If a card in the mockup needs a button
or a small colored label, it always means "use one of these three with
different props" — never "write new markup for it."**

---

## Also new: landing page cards you can copy from

The welcome/landing page (`src/components/landing/`) was just built and
has a card component that looks a lot like some of the cards in this
mockup. You don't have to use it, but look at it first — copying and
adjusting is much faster than starting from a blank file.

### If you're Developer B ("Curated for You")

Open `src/components/landing/BentoImageCard.tsx` before you write
`FeaturedEventCard.tsx` or `CuratedEventCard.tsx`. It's the same visual
idea: a background photo with a see-through ("glass") panel of text
sitting on top of it — which is exactly what "Vienna River Run Collective"
and the two small cards next to it look like.

- `BentoImageCard` with `size="lg"` ≈ your `FeaturedEventCard`. Same
  layout (photo, tag, title, description, button in the corner). It's not
  a perfect match yet — you'll need to add: a second badge (right now it
  only takes one `tag`, but the mockup needs "Featured Club" *and*
  "Intermediate"), a real "Join Group" text button (right now it shows an
  arrow icon, not a button), and a members count.
- `BentoImageCard` with `size="sm"` ≈ your `CuratedEventCard`. Same idea,
  smaller. Right now it only shows a title + arrow icon — you'll need to
  add a small badge and a time/date line under the title.

Easiest path: copy `BentoImageCard.tsx` into your own new file and adjust
it (don't edit the original — the landing page uses it too). Once `Badge`
exists, swap its plain tag `<span>` for `<Badge>` so both pages end up
using the same pill styling.

### If you're Developer A ("Happening Now")

Nothing in the landing page matches your cards. "Stadtpark Open" and
"Velodrome Sprint" put the text *below* the photo in a plain box, not
overlaid on top of it like the landing cards. Build `LiveEventCard` from
scratch as described below, using `Badge` for the pills.

One small thing you can still borrow: `src/components/events/EventCard.tsx`
already knows how to show an event photo with a fallback picture when
there isn't a real one yet — see `resolveMediaUrl` and
`DEFAULT_EVENT_IMAGE_SRC`, imported from `src/utils/media.ts`. You don't
need `EventCard` itself (it's wired to real join/leave buttons you don't
need here) — just reuse those two image-fallback helpers so a missing
photo doesn't break your card.

---

## Rule #1: reuse what already exists — do not build a new button

We already have two button components in the codebase. **Nobody should
ever write a raw `<button>` with custom styling by hand.** If you think you
need a new button, you almost certainly just need one of these two, with
different props:

### `Button` — `components/shared/Button.tsx`

Use this for any button that has **text on it**. This is the same
component already used in the header for "Join Club" and "Logout".

```tsx
import Button from "../shared/Button";

<Button variant="secondary">{t("discover.joinGroup")}</Button>
```

Variants available: `primary`, `secondary`, `outline`, `danger`, `glass`,
`indigo`. Sizes: `xs`, `sm`, `md`, `lg`.

The **"Join Group" button** on the big featured card in the mockup is a
`Button`, not a new component. Try `variant="secondary"` first (light
background, works well over a photo); if it looks off against the photo,
try `variant="glass"` instead — that variant exists specifically for
buttons sitting on top of images. Do not invent a third style for this.

### `IconButton` — `components/shared/IconButton.tsx`

Use this for any button that is **only an icon, with no visible text**
(this is what the header uses for the bell and the dark-mode toggle).
Nothing in the Discover main content needs this right now, but if a design
later adds one (e.g. a bookmark/save icon on a card), reuse this — don't
write a raw `<button><SomeIcon /></button>` by hand.

```tsx
import { IconButton } from "../shared/IconButton";

<IconButton aria-label={t("discover.save")} icon={<Bookmark size={18} />} />
```

### The pattern to copy: `FilterGroup`

`components/discover/FilterGroup.tsx` is the existing example of "build one
small reusable piece, reuse it 3 times" — `Sidebar.tsx` renders it for
Categories, Level, and Time instead of writing three separate blocks of
markup. Copy this same instinct for `LiveEventCard` and `CuratedEventCard`:
build the card once, reuse it per item.

---

## Prerequisite (lead is building this now, before assigning): `Badge`

Every card in this design has small pill/tag labels — "Live Match",
"Session Started", "Tennis", "Cycling", "Intermediate", "Featured Club",
"Yoga", "Strength". That's a new pattern that doesn't exist as a shared
component yet, and **both developers will need it**, so build it once,
upfront, to avoid two people creating two slightly different badge
components.

**File:** `components/shared/Badge.tsx`

```tsx
type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "live" | "solid";
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantClasses = {
    default: "bg-[var(--surface)] text-[var(--text)] border border-[var(--surface-border)]",
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

Both developers import this the same way:

```tsx
import { Badge } from "../shared/Badge";

<Badge variant="live">{t("discover.liveMatch")}</Badge>
<Badge>{t("discover.tennis")}</Badge>
```

Adjust the exact classes once you see it rendered — the point is that it's
**one** component both sections pull from, not two.

---

## Developer A — "Happening Now" section

**Branch:** `feature/discover-happening-now`

**Files you own (new files only, nobody else touches these):**
- `components/discover/LiveEventCard.tsx`
- `components/discover/HappeningNowSection.tsx`

**What to build:**

1. `LiveEventCard` — one card, taking props: `image`, `status` (e.g. "Live
   Match" / "Session Started"), `sport` (e.g. "Tennis"), `title`,
   `location`. Use `Badge` for the status pill (top-left, `variant="live"`)
   and the sport pill (`variant="default"`, next to the title).
2. `HappeningNowSection` — renders the `{t("discover.happeningNow")}`
   heading with the small red live dot next to it, then maps a hardcoded
   array of 2 items onto `LiveEventCard`. Keep the array inside this file
   for now (same pattern as `SPORT_OPTIONS` in `Sidebar.tsx`) — it becomes
   real API data later, in a separate task.

**i18n keys you need already exist** — don't add new ones unless you're
missing something: `discover.happeningNow`, `discover.liveMatch`,
`discover.sessionStarted`.

**Do not touch:** `DiscoverMain.tsx`, `DiscoverPage.tsx`, or anything under
`FeaturedEventCard` / `CuratedEventCard` / `CuratedForYouSection`.

---

## Developer B — "Curated for You" section

**Branch:** `feature/discover-curated-for-you`

**Files you own (new files only, nobody else touches these):**
- `components/discover/FeaturedEventCard.tsx`
- `components/discover/CuratedEventCard.tsx`
- `components/discover/CuratedForYouSection.tsx`

**What to build:**

1. `FeaturedEventCard` — the one large card: background image, `Badge`s for
   "Featured Club" / level (e.g. "Intermediate"), title, description, a
   **`Button` (not a new component)** for "Join Group", and a members count
   with a people icon next to it.
2. `CuratedEventCard` — the smaller side cards: image, one `Badge` for the
   category (e.g. "Yoga", "Strength"), title, and a time/date line.
3. `CuratedForYouSection` — renders the `{t("discover.curatedForYou")}`
   heading, one `FeaturedEventCard`, and a small hardcoded array mapped onto
   `CuratedEventCard` (2 items in the mockup).

**i18n keys you need already exist:** `discover.curatedForYou`,
`discover.joinGroup`, `discover.members`, `discover.featuredClub`.

**Do not touch:** `DiscoverMain.tsx`, `DiscoverPage.tsx`, or anything under
`LiveEventCard` / `HappeningNowSection`.

---

## Integration (lead, after both PRs are merged)

**Files:**
- `components/discover/DiscoverMain.tsx` — new, just stacks the two
  sections:
  ```tsx
  export function DiscoverMain() {
    return (
      <div className="discover-main">
        <HappeningNowSection />
        <CuratedForYouSection />
      </div>
    );
  }
  ```
- `pages/DiscoverPage.tsx` — replace the old placeholder content with
  `<Sidebar ... /><DiscoverMain />`.

This is done last, by one person, specifically so neither developer's
branch has to touch a file the other is also touching.

---

## What about the Sidebar?

`components/layout/Sidebar.tsx` and `components/discover/FilterGroup.tsx`
are **already built** and already match the mockup (Categories, Level,
Time). Neither developer needs to touch these files — they're not part of
this task split.

One thing worth knowing before either dev reads that code: `FilterGroup`
uses a raw `<button>` for its filter chips, which looks like it breaks
"Rule #1" above. It doesn't — it's a deliberate exception, but not because
filter chips are "just display with no action." They do have an action:
selecting one filters the events shown on the page (that filtering logic
is being wired up as a separate task).

The real reason it doesn't reuse `Button`: `Button`'s variants
(`primary`/`secondary`/`outline`/...) describe how important an action
looks, not "is this the one currently chosen out of a set of options."
A filter chip has to keep showing which option is active even after the
click is over — a persistent selected/unselected state that `Button` has
no prop for today. That's a different requirement than what `Button` was
built for, so `FilterGroup` owns its own small styling for it instead of
forcing it through `Button`. Don't copy the raw-`<button>` pattern for
anything in `HappeningNowSection` or `CuratedForYouSection` — those cards
don't need persistent selected state, so they should use `Button` /
`IconButton` normally.

---

## Checklist before opening a PR

- [ ] No raw `<button>` anywhere — used `Button` or `IconButton`.
- [ ] No repeated pill/tag markup — used `Badge`.
- [ ] No hardcoded visible text — everything goes through `t("discover.…")`.
- [ ] No hardcoded colors — only CSS variables from `global.css`.
- [ ] Card component built once, reused via `.map()` for repeated items —
      not copy-pasted per item.
- [ ] Commit message follows `DEV.md` convention (`FEAT:`, `UI:`, etc.), one
      logical change per commit.

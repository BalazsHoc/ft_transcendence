# Discover Page

The Discover page has three regions sitting side by side under the header:
a filter sidebar, the main content, and (globally, not part of this page) the
footer.

```text
discover-layout
├── Sidebar             already built — Categories / Level / Time filters
├── DiscoverMain         the main content column (this doc explains this part)
│   ├── HappeningNowSection
│   │   └── LiveEventCard        (repeated card, one per live event)
│   └── CuratedForYouSection
│       ├── FeaturedEventCard    (the one big card)
│       └── CuratedEventCard     (repeated small card)
└── Footer               NOT part of this page — it's global, see below
```

## Where each piece lives

| Component | File | What it shows |
|---|---|---|
| `Sidebar` | `components/layout/Sidebar.tsx` | The filter panel on the left: category chips, level checkboxes, time radio buttons. Already built. |
| `DiscoverMain` | `components/discover/DiscoverMain.tsx` | Everything to the right of the sidebar. Its only job is to stack the two sections below, top to bottom. |
| `HappeningNowSection` | `components/discover/HappeningNowSection.tsx` | The "Happening Now" title with the red live dot, plus a row of live event cards. |
| `LiveEventCard` | `components/discover/LiveEventCard.tsx` | One card in that row (e.g. "Stadtpark Open"). Built once, reused for every live event so they all look identical. |
| `CuratedForYouSection` | `components/discover/CuratedForYouSection.tsx` | The "Curated for You" title, plus one big card and a couple of small cards next to it. |
| `FeaturedEventCard` | `components/discover/FeaturedEventCard.tsx` | The one large card with a background photo, description, and a "Join Group" button (e.g. "Vienna River Run Collective"). |
| `CuratedEventCard` | `components/discover/CuratedEventCard.tsx` | The smaller cards next to the big one (e.g. "Morning Flow & Focus"). Built once, reused for each one. |
| `Footer` | `components/layout/Footer.tsx` | The bar at the very bottom of every page. Already built, and it's rendered once in `AppLayout.tsx` — it does **not** belong inside the Discover page itself. |


## Step by step: how to actually build this, if you don't know where to start

Build from the smallest, most inner piece outward — never start with the
page itself.

1. **Build the card first, with fake/hardcoded data.**
   Start with `LiveEventCard.tsx`. Don't worry about real data yet — just
   make one component that takes props like `title`, `location`, `sport`,
   `status`, and `image`, and renders exactly one card the way it looks in
   the design. Test it by rendering it once with made-up text.

2. **Repeat step 1 for each other card type.**
   `FeaturedEventCard.tsx` and `CuratedEventCard.tsx` — same idea, one
   component per visual card shape, still with fake data passed in as
   props.

3. **Build the section that lays out those cards.**
   `HappeningNowSection.tsx` renders the "Happening Now" heading, then maps
   over a small hardcoded array of two or three items and renders one
   `LiveEventCard` per item (same pattern already used in `Sidebar.tsx` with
   its `SPORT_OPTIONS` array). Do the same for `CuratedForYouSection.tsx`.

4. **Stack the sections in `DiscoverMain.tsx`.**
   This file barely does anything — it just renders
   `<HappeningNowSection />` then `<CuratedForYouSection />` underneath. Its
   only job is layout spacing between the two.

5. **Plug `DiscoverMain` into the page.**
   In `DiscoverPage.tsx`, replace the old placeholder content with:
   ```tsx
   <div className="discover-layout">
     <Sidebar ... />
     <DiscoverMain />
   </div>
   ```

6. **Only after everything visually matches the design**, go back and
   replace the hardcoded arrays with real data from `eventsApi.ts`, the same
   way `EventCard` already does for the old event list. Do this last, not
   first — get the look right with fake data, then make it real.

## Rules to keep in mind while building (from `FRONTEND_GUIDELINES.md`)

- No visible text hardcoded directly in JSX — every label/title goes
  through `t("discover.something")`, added to `en.json`, `de.json`, and
  `ua.json` at the same time.
- No hardcoded colors — use the existing CSS variables (`--text`,
  `--surface`, `--surface-border`, etc.) from `global.css`, the same way
  `Sidebar.tsx` and `FilterGroup.tsx` already do.
- One component, one job. If a component starts doing two unrelated
  things, split it again.

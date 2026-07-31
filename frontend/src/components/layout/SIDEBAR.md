# Sidebar
## What each piece is (plain language)

| Name | File location | What it actually is |
|---|---|---|
| **Sidebar** | `src/components/layout/Sidebar.tsx` | The whole filter panel box on the left of the Discover page — "Categories", "Level", "Time" together. |
| **FilterGroup** | `src/components/discover/FilterGroup.tsx` | One filter section by itself. It doesn't know it's being used three times — each time it's given a title, a list of choices, and told to draw itself as chips, checkboxes, or radio buttons. |
| `.sidebar` (CSS) | `src/styles/global.css` | The rule that gives the sidebar its fixed width, makes it stick in place while the page scrolls, and hides it on small screens. |
| `.filter-chip` / `.filter-checkbox` / `.filter-radio` (CSS) | `src/styles/global.css` | The look of each filter type — the rounded pill for Categories, the square box for Level, the round dot for Time. |
| `.discover-layout` (CSS) | `src/styles/global.css` | Places the Sidebar and the main content side by side, with the correct spacing between them. |
| `.discover-main` (CSS) | `src/styles/global.css` | Wraps everything to the right of the Sidebar into one column, so it doesn't get split into several side-by-side pieces by `.discover-layout`. |

## How `Sidebar.tsx` uses `FilterGroup`

`Sidebar` owns three small hardcoded lists of options (what the choices are)
and three pieces of state passed in as props (which choice is currently
selected). It doesn't draw anything itself — it just tells `FilterGroup`
what to draw, three times, with different data and a different `type`:

```tsx
<FilterGroup
  title="Categories"
  options={SPORT_OPTIONS}
  selected={sport}
  onChange={onSportChange}
  type="chips"
/>
<FilterGroup
  title="Level"
  options={LEVEL_OPTIONS}
  selected={level}
  onChange={onLevelChange}
  type="checkbox"
/>
<FilterGroup
  title="Time"
  options={TIME_OPTIONS}
  selected={time}
  onChange={onTimeChange}
  type="radio"
/>
```

`Sidebar` itself holds no state — `sport`, `level`, and `time` all live in
`DiscoverPage.tsx` (the parent), and get passed down as props. Same
controlled-component pattern as `HeaderSearch` in the header: the parent
owns the value, the child just displays it and reports changes back up
through `onChange`.

## Rules followed

- No hardcoded visible text for the section titles passed into
  `FilterGroup` — these should go through `t()` the same way the header
  does (currently still literal strings `"Categories"` / `"Level"` /
  `"Time"` in `Sidebar.tsx` — worth fixing to use `t("discover.categories")`
  etc., since those i18n keys already exist in `en.json`/`de.json`).
- No hardcoded colors — all sidebar/filter CSS uses the existing
  `--text`, `--surface`, `--surface-border`, `--muted` CSS variables.
- One component, one job — `FilterGroup` only knows how to draw a filter
  section; it has no idea what "Categories" or "Level" even mean.

## Adding to the sidebar

- New filter section (e.g. "Distance") → add one more `<FilterGroup />` in
  `Sidebar.tsx` with its own options array and state, don't build a new
  component for it.
- New filter *display type* (e.g. a slider) → add a new `type` branch
  inside `FilterGroup.tsx`, don't create a separate component.

# Map Page

This doc explains the Map page well enough to defend it in a 42 evaluation:
what was built, what was reused, and — the two things an evaluator will
almost certainly poke at — **how the map itself works** and **how zoom /
cursor behavior works**.

```text
MapPage
├── MapFilterBar
│   ├── LocationAutocomplete
│   ├── FilterGroup
│   └── Button
├── MapEventPanel
│   └── Button
└── MapZoomControls
    └── IconButton
```

Nothing in this feature draws a raw `<button>` — every clickable thing is
`Button` or `IconButton` from `components/shared/`, the same two components
already used in the Header and Discover page.

## Where each piece lives

| Component | File | New or reused | What it does |
|---|---|---|---|
| `MapPage` | `pages/MapPage.tsx` | Rewritten | Owns every piece of state (events, filters, selected event, the Leaflet map instance itself) and renders the map + the three components below on top of it. |
| `MapEventPanel` | `components/map/MapEventPanel.tsx` | **New** | The card on the left: event photo, sport badge, title, address, a 4-cell stat grid (Time / Level / Sport / Spots), the description, the creator's avatar+name, and a Reserve Spot / Leave button. Shows a placeholder message when no event is selected. |
| `MapFilterBar` | `components/map/MapFilterBar.tsx` | **New** | The floating pill bar at the top: a location search box, a "Today" toggle, and a "Filters" button that opens a small dropdown reusing `FilterGroup` (sport chips + level radio buttons). |
| `MapZoomControls` | `components/map/MapZoomControls.tsx` | **New** | The floating +/- zoom buttons and the "use my location" button, bottom-right of the map. |
| `LocationAutocomplete` | `components/geo/LocationAutocomplete.tsx` | Reused | Already existed before this feature — the address search input with a dropdown of suggestions. |
| `FilterGroup` | `components/discover/FilterGroup.tsx` | Reused | The same sport/level filter component the Discover page's `Sidebar` already used. |
| `Button` / `IconButton` | `components/shared/` | Reused | The app's only two button components — every button on this page is one of these two with different props. |

---

## How the map itself is implemented

### 1. Leaflet isn't installed as an npm package — it's loaded at runtime

Look at `ensureLeaflet()` at the top of `MapPage.tsx`. Instead of
`import L from "leaflet"`, it injects a `<script>` and `<link>` tag into
the page the first time the Map page is opened:

```ts
const script = document.createElement("script");
script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
document.body.appendChild(script);
```

Once that script finishes loading, the whole Leaflet library is available
as a global `window.L`. This was already the pattern used before this
rewrite — kept it because it avoids adding a bundler dependency, and the
library is cached (`leafletLoader` is a module-level `Promise`, so it only
ever downloads once, even if you leave the page and come back).

### 2. Creating the map instance

Inside a `useEffect` that runs once on mount:

```ts
const map = window.L.map(mapContainerRef.current, { zoomControl: false })
  .setView([48.2082, 16.3738], 12); // Vienna, zoom level 12
```

- `mapContainerRef` is a plain empty `<div>` — Leaflet takes over that DOM
  node completely and injects its own canvas/tile layers inside it.
- `zoomControl: false` turns off Leaflet's *built-in* +/- buttons, because
  `MapZoomControls` draws our own instead (see below) to match the design.
- The map instance is stored in a `ref` (`mapRef`), not `state` — because
  it's a mutable object we call methods on directly (`.zoomIn()`,
  `.setView()`, etc.), not something we want triggering a React re-render.

### 3. The tile layer (the actual map imagery)

A **tile layer** is just hundreds of small square images (256×256px)
stitched together, requested from a map image provider as you pan/zoom.
We use CARTO's free tile service, with two different URLs — one styled for
light mode, one for dark mode:

```ts
tileLayerRef.current = window.L.tileLayer(selectedStyle.url, {
  attribution: selectedStyle.attribution,
  maxZoom: 19,
}).addTo(mapRef.current);
```

This re-runs whenever `mapTheme` changes (a `MutationObserver` watches
`document.body`'s class list for `dark`/light toggling), removing the old
tile layer and adding the new one — that's how the map itself switches
style when you hit the dark mode toggle in the header.

### 4. Drawing event markers — the "layer group" pattern

Every time the list of events-to-show changes (filters change, a new
event loads, you search a location), one `useEffect` **clears and redraws
every marker from scratch**:

```ts
const layer = layerRef.current; // a window.L.layerGroup()
layer.clearLayers();

visibleEvents.forEach((event) => {
  const icon = window.L.divIcon({
    className: isSelected ? styles.eventMarkerSelected : styles.eventMarker,
    html: `<span style="background:${sportColor(event.sport)}"></span>`,
  });
  const marker = window.L.marker([event.latitude, event.longitude], { icon }).addTo(layer);
  marker.on("click", () => setSelectedEventId(event.id));
});
```

Two things worth being able to explain here:

- **Why a `layerGroup` and not adding markers straight to the map?** A
  `layerGroup` is a container you can clear in one call
  (`layer.clearLayers()`). Without it you'd have to manually track and
  remove every individual marker yourself every time the list changes.
- **Why a plain colored `<span>` (`divIcon`) instead of an image pin?**
  `divIcon` lets the marker be styled with regular CSS (see
  `global.css` → the "MAP PAGE" section → `.eventMarker`), so the color can be set inline
  per-sport (`sportColor()` maps `"swimming"` → teal, `"tennis"` → indigo,
  etc.) without needing a separate image file per color/sport combination.

Clicking a marker calls `setSelectedEventId(event.id)`, which is the one
piece of state that connects the map to `MapEventPanel` — the panel always
renders whatever event matches that id.

### 5. Filtering

`visibleEvents` (a `useMemo`) is the single source of truth for "what
should currently have a marker." It applies, in order: sport filter →
level filter → "today only" filter → distance-from-searched-location
filter (using a haversine `distanceKm()` function, kept from the original
implementation, that measures the straight-line distance in km between two
lat/lng points on a sphere). Whichever event is selected always comes from
this same filtered list, so a filter change can never leave a marker-less
event "stuck" selected.

---

## How zoom in / zoom out works

Leaflet's map object always has built-in `.zoomIn()` / `.zoomOut()`
methods, regardless of whether its default on-map buttons are shown. We
turned the default buttons off (`zoomControl: false`, step 2 above) and
built our own that call the same methods:

```tsx
// MapZoomControls.tsx
<IconButton icon={<Plus />} onClick={onZoomIn} />
<IconButton icon={<Minus />} onClick={onZoomOut} />
```

```ts
// MapPage.tsx
function handleZoomIn() { mapRef.current?.zoomIn(); }
function handleZoomOut() { mapRef.current?.zoomOut(); }
```

So the zoom **logic** (redrawing tiles at a new zoom level, animating the
transition) is 100% Leaflet's own code — we only supply two buttons that
call into it. This is also how mouse scroll-wheel zoom and pinch-to-zoom
already work without us writing anything for them: Leaflet attaches those
listeners to the map container itself when `L.map(...)` is called.

The "locate me" button is the one zoom-adjacent feature we *do* implement
ourselves, using the browser's own geolocation API (not Leaflet):

```ts
navigator.geolocation.getCurrentPosition((position) => {
  mapRef.current?.setView([position.coords.latitude, position.coords.longitude], 14);
});
```

`setView(coords, zoom)` recenters and zooms the map to a specific point in
one call — this is also what happens when you click a search result in the
location search box, or click a marker.

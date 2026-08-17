# Frontend design system

This document is the short implementation reference for the Vienna Connect
frontend. The source of truth is the token layer in
[`src/styles/global.css`](src/styles/global.css), the Tailwind theme in
[`tailwind.config.js`](tailwind.config.js), and the shared components in
[`src/components/shared`](src/components/shared).

## Principles

- Keep the interface calm, readable, and useful for an active local community.
- Prefer shared primitives and design tokens over one-off colors, spacing, or
  controls.
- Keep the same information hierarchy on desktop and mobile; only the layout
  changes at smaller widths.
- Preserve keyboard focus, readable contrast, and clear validation states.

## Tokens

Tokens are CSS custom properties, so the same component automatically follows
the light/dark theme switch.

| Role | Light | Dark |
|---|---|---|
| Page background | `--bg: #f4f5f4` | `#0b0f19` |
| Main text | `--text: #111827` | `#e5e7eb` |
| Secondary text | `--muted: #6b7280` | `#9ca3af` |
| Surface | `--surface: #ffffff` | `#111827` |
| Surface border | `--surface-border: #e5e7eb` | `#1f2937` |
| Form background | `--control-bg: #ffffff` | `#0f172a` |
| Primary action | `--button-bg: #174b69` | `#1f2937` |
| Header active state | `--header-link-active-bg: #7355aa` | `#7b54c5` |

The radius scale is deliberately small: `--radius-card: 8px`,
`--radius-button: 12px`, and `--radius-badge: 999px`. Tailwind's default
spacing scale is used for layout (4px increments), with larger sections using
responsive `gap`, `padding`, and `max-w` utilities.

## Typography

- Body text uses Montserrat, with Inter and system fallbacks.
- Display headings use Hanken Grotesk through the `font-display` Tailwind
  family.
- UI labels and metadata should use normal or medium weight; reserve heavy
  weights for page titles and prominent numbers.
- Use responsive Tailwind text sizes instead of hard-coded font sizes in new
  components.

## Reusable component inventory

These are the shared building blocks to extend before introducing a new visual
pattern:

| Component | Location | Use |
|---|---|---|
| `Button` | `src/components/shared/Button.tsx` | Primary, secondary, outline, danger, and icon actions |
| `IconButton` | `src/components/shared/IconButton.tsx` | Compact toolbar and header actions |
| `Badge` | `src/components/shared/Badge.tsx` | Status, category, and live-state labels |
| `ConfirmDialog` | `src/components/shared/ConfirmDialog.tsx` | Destructive-action confirmation |
| `LanguageSwitcher` | `src/components/shared/LanguageSwitcher.tsx` | Locale selection |
| `PresenceStatus` | `src/components/shared/PresenceStatus.tsx` | Online/offline indicator |
| `PhotoBackdrop` | `src/components/shared/PhotoBackdrop.tsx` | Image-backed hero surfaces |
| `Header` / `HeaderNav` | `src/components/layout` | Global navigation and responsive menu |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | Desktop filtering/navigation rail |
| `EventCard` | `src/components/events/EventCard.tsx` | Event list and discovery cards |
| `GroupCard` | `src/components/groups/GroupCard.tsx` | Group list cards |
| `FilterGroup` | `src/components/discover/FilterGroup.tsx` | Reusable filter controls |
| `LocationAutocomplete` | `src/components/geo/LocationAutocomplete.tsx` | Address search and selection |

Use these components through their props rather than duplicating their CSS.
For example:

```tsx
import Button from "../components/shared/Button";

<Button variant="primary" type="submit">
  Create group
</Button>;
```

## Patterns and accessibility

- Forms must expose labels, required fields, inline validation, and a clear
  submit/loading/error state.
- Cards use `--surface`, `--surface-border`, `--radius-card`, and a restrained
  shadow; interactive cards should expose a visible focus state.
- Use `Button` or `IconButton` for actions, with an accessible label for
  icon-only controls. Do not nest links or buttons inside another link.
- Use `aria-live` for async errors and notification counts where applicable.
- Keep touch targets at least 40px high for primary controls and preserve a
  usable one-column layout on narrow screens.

When a new component is needed, add it to the shared layer if it has a stable
API and is used in two or more places. Update this inventory when a reusable
primitive is introduced.

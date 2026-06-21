# Frontend Development Guidelines

## General Principles

- Keep components small and reusable.
- Avoid duplicated code.
- Use TypeScript types for all API responses.
- Follow mobile-first responsive design.
- Accessibility is required.

## Styling Rules

### Global Styling Only

All colors, typography, spacing, shadows, breakpoints and theme variables must be defined in:

```text
src/styles/global.css
```

### Dark / Light Theme

Never hardcode colors inside components.

Use CSS variables only.

## Internationalization (i18n)

### Important Rule

Never hardcode visible text.

Wrong:

```tsx
<h1>Create Event</h1>
```

Correct:

```tsx
<h1>{t("event.create")}</h1>
```

Translation files:

```text
src/i18n/locales/en.json
src/i18n/locales/de.json
src/i18n/locales/ua.json
```

Supported languages:

- English
- German
- Ukrainian

All new UI features must include translations for all languages.

*For Ukrainian language leave English, @oshcheho will translate it to Ukrainian

## Project Structure

```text
src/
	api/
	app/
	components/
	features/
	i18n/
	layouts/
	pages/
	styles/
	types/
```

## Components

- One responsibility per component
- Prefer reusable components
- Extract repeated code

## API Layer

Never call fetch directly inside pages.

Use api service files:

```text
api/
authApi.ts
eventsApi.ts
client.ts
```

## Forms

Validate on both frontend and backend:

- Required fields
- Length limits
- Email format
- Date validity

## Responsive Design

Support:

- Mobile
- Tablet
- Desktop

Breakpoints:

- 320px
- 768px
- 1024px
- 1440px

## Commit Format

Feature:

```text
FEAT: add event creation page
```

Fix:

```text
FIX: correct login validation
```

Refactor:

```text
REFACTOR: simplify auth context
```

UI:

```text
UI: redesign event card
```

Docs:

```text
DOCS: update frontend guidelines
```

## Golden Rules

- UI -> components/pages
- API -> api services
- Translations -> i18n
- Styles -> global.css or component styles
- Repeated code more than twice should become a reusable component

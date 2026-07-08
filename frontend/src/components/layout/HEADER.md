# Header

The header split into small, single-purpose
components so each piece is easy to read, test, and reuse.


## How `Header.tsx` uses them

`Header` keeps only the `search` state and composes the pieces:

```tsx
<header>
  <div>
    <HeaderBrand />
    <HeaderNav />
  </div>
  <div>
    <HeaderSearch value={search} onChange={setSearch} />
    <Button variant="primary">{t("nav.joinClub")}</Button>
    <IconButton variant="outline" onClick={onToggleDarkMode} icon={...} />
    <LanguageSwitcher />
    <IconButton icon={<Bell />} aria-label={t("nav.notifications")} />
    <HeaderUserMenu />
  </div>
</header>
```

## What each piece is (plain language)

list of the components inside the header component:

| Name | File location | What it actually is |
|---|---|---|
| **Header** | `src/components/layout/Header.tsx` | The whole grey bar at the very top of the page. Everything else in this list is a piece living inside it. |
| **HeaderBrand** | `src/components/layout/HeaderBrand.tsx` | The "VIENNA ATHLETIC" name on the top-left. Clicking it takes you back to the home page. |
| **HeaderNav** | `src/components/layout/HeaderNav.tsx` | The row of clickable words next to the name: Discovery, Clubs, Map, Community. It's the site's main menu. |
| **HeaderSearch** | `src/components/layout/HeaderSearch.tsx` | The rounded search box where you type to look for an activity or a club. |
| **Button** | `src/components/shared/Button.tsx` | A clickable button that has a word written on it, like "Join Club". It's reused everywhere so every button in the app looks the same. |
| **IconButton** | `src/components/shared/IconButton.tsx` | A clickable button that has only a small picture on it and no word — like the bell 🔔 or the sun/moon toggle. Same idea as Button, just for picture-only buttons. |
| **LanguageSwitcher** | `src/components/shared/LanguageSwitcher.tsx` | The small dropdown that lets you change the site's language (English, German, Ukrainian). |
| **HeaderUserMenu** | `src/components/layout/HeaderUserMenu.tsx` | If you're signed in: shows your photo, your name, and a logout button. If you're not signed in: shows a plain little person icon instead. |

## Rules followed

- No hardcoded visible text — every label goes through `t()`, with keys
  added to `en.json`, `de.json`, and `ua.json`.
- No hardcoded colors — all styling uses the existing `--text`,
  `--surface`, `--surface-border`, etc. CSS variables from `global.css`.
- Every icon-only button has an `aria-label`.

## Adding to the header

- New nav link → edit `HeaderNav.tsx` only.
- New icon action (e.g. settings) → reuse `IconButton`, don't write a raw
  `<button>`.
- New auth-dependent UI → edit `HeaderUserMenu.tsx` only.

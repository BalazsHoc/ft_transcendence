# Curated for You — Components We Made vs Reused

**Task:** Developer B — “Curated for You” (from Mina’s `TASKS.md`)  
**Branch:** `feature/discover-curated-for-you`  
**Related doc:** `.local/CURATED_FOR_YOU_TASK.md` (full task + code dumps)

This file answers one question clearly: **what did we create, and what did we reuse?**

---

## 1. Big picture

```text
CuratedForYouSection          ← WE MADE THIS (section)
├── heading "Curated for You"
├── FeaturedEventCard         ← WE MADE THIS (big card)
│     uses → Badge, Button, media helpers
└── CuratedEventCard × 2      ← WE MADE THIS (small card)
      uses → Badge, media helpers
```

Also we made **`Badge`** (shared pill) because Mina said to create it — Balazs uses it too.

---

## 2. Components / files WE CREATED

| File | What it is | One-sentence job |
|------|------------|------------------|
| `components/shared/Badge.tsx` | Shared pill/tag | Small rounded label (“Featured Club”, “Yoga”, …) |
| `components/discover/FeaturedEventCard.tsx` | Big card | Photo + 2 badges + title + description + Join button + members |
| `components/discover/CuratedEventCard.tsx` | Small card | Photo + 1 badge + title + time line |
| `components/discover/CuratedForYouSection.tsx` | Section | Title + 1 big card + 2 small cards (fake data + `.map()`) |

### Also changed (not new components, but part of the task)

| File | What we did |
|------|-------------|
| `i18n/locales/en.json` | Added discover keys for curated demo text |
| `i18n/locales/de.json` | Same keys in German |
| `i18n/locales/ua.json` | Same keys (English OK for UA per team rule) |
| `styles/global.css` | Added `.curated-for-you*` layout classes |

---

## 3. Existing pieces WE REUSED (did not rebuild)

| Existing thing | Path | Used for |
|----------------|------|----------|
| **Button** | `components/shared/Button.tsx` | “Join Group” on the big card (`variant="secondary"`) |
| **resolveMediaUrl** | `utils/media.ts` | Safe image URL if photo is missing |
| **DEFAULT_EVENT_IMAGE_SRC** | `utils/media.ts` | Fallback event image |
| **useTranslation / `t()`** | react-i18next (already in project) | All visible text via dictionary |
| **Users icon** | `lucide-react` | Member count icon on featured card |
| **CSS variables** | `styles/global.css` | `--text`, `--surface`, … (theme / dark mode) |
| **BentoImageCard** | `components/landing/BentoImageCard.tsx` | **Visual idea only** — we copied the layout idea, we did **not** edit this file |
| **FilterGroup pattern** | `components/discover/FilterGroup.tsx` | Idea: build once, reuse with `.map()` (Mina’s example) |
| **Sidebar / Header / DiscoverPage** | already existed | We did **not** edit these for this task (wiring was lead’s job later) |

---

## 4. Per-file: created vs reused

### A) `Badge.tsx` — CREATED

| Created | Reused |
|---------|--------|
| The whole `Badge` component | CSS variables (`--surface`, `--text`, …) |

**Variants:** `default` | `live` | `solid`  
**Used by:** Featured card, curated cards, and later Balazs’s Live cards / our Club page.

---

### B) `FeaturedEventCard.tsx` — CREATED

| Created | Reused |
|---------|--------|
| `FeaturedEventCard` component | `Badge` (ours, but shared) |
| | `Button` (already in project) |
| | `Users` from lucide-react |
| | `resolveMediaUrl`, `DEFAULT_EVENT_IMAGE_SRC` |
| | `t("discover.featuredClub")`, `t("discover.joinGroup")`, `t("discover.members")` |

**Layout idea from:** `BentoImageCard` (large) — inspiration only.

---

### C) `CuratedEventCard.tsx` — CREATED

| Created | Reused |
|---------|--------|
| `CuratedEventCard` component | `Badge` |
| | `resolveMediaUrl`, `DEFAULT_EVENT_IMAGE_SRC` |

**No Button** on small cards (per design).  
**Layout idea from:** `BentoImageCard` (small).

---

### D) `CuratedForYouSection.tsx` — CREATED

| Created | Reused |
|---------|--------|
| `CuratedForYouSection` | **Our** `FeaturedEventCard` |
| Hardcoded `curatedEvents` array | **Our** `CuratedEventCard` via `.map()` |
| | `useTranslation` / `t()` for all strings |

This section is the “parent” that puts the cards together.

---

## 5. Simple tree (who uses whom)

```text
WE CREATED                          WE REUSED
──────────                          ─────────
Badge  ───────────────────────────►  (CSS vars)

FeaturedEventCard ──uses──────────►  Badge, Button, lucide, media utils, t()

CuratedEventCard ───uses──────────►  Badge, media utils

CuratedForYouSection ─uses────────►  FeaturedEventCard, CuratedEventCard, t()
```

---

## 6. What we did NOT create / touch

| Thing | Why |
|-------|-----|
| New custom `<button>` styles | Must use shared `Button` |
| New pill styles inside each card | Must use shared `Badge` |
| `DiscoverPage.tsx` / `DiscoverMain.tsx` | Lead integrates later (avoid conflicts) |
| `LiveEventCard` / Happening Now | Developer A’s task |
| Backend / API | Fake data only for this task |
| Editing `BentoImageCard.tsx` | Landing page still needs the original |

---

## 7. Commits (what landed in git)

| Commit | Contents |
|--------|----------|
| `FEAT: add shared Badge component…` | `Badge.tsx` only |
| `FEAT: add Curated for You section components` | 3 discover components + i18n + `global.css` |

Check files in a commit yourself:

```bash
git show --name-status --oneline <commit-hash>
```

---

## 8. How to remember it (one sentence each)

1. **Badge** = small tag sticker (we built it once for everyone).  
2. **FeaturedEventCard** = one big event card (reuses Badge + Button).  
3. **CuratedEventCard** = one small event card (reuses Badge).  
4. **CuratedForYouSection** = puts 1 big + 2 small cards on the Discover page area.

---

## 9. Related local docs

| File | Use it for |
|------|------------|
| `CURATED_FOR_YOU_TASK.md` | Full task story + full code dumps |
| `CURATED_FOR_YOU_COMPONENTS.md` | **This file** — made vs reused |
| `CLUB_PROFILE_CODE_WALKTHROUGH.md` | Same style of guide for the Club page |

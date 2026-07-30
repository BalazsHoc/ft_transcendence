# Your Study Guide — From C to Your React Code

**Teacher note:** You already built two features with help. That is normal.  
Your job now is **not** to memorize everything — it is to learn a **reading order** so the code stops looking like noise.

You know **C**. Treat React like a different dialect of “functions + structs + calling functions,” not like magic.

---

## Part 0 — Stop and reset your brain

You have many `.md` files. **Do not open them all at once.**

| File | When to read it |
|------|-----------------|
| **THIS FILE** (`.local/STUDY_GUIDE_FROM_C.md`) | **First** — every time you study |
| `CURATED_FOR_YOU_COMPONENTS.md` | After Lesson 1 — “what we made vs reused” |
| `CLUB_PROFILE_CODE_WALKTHROUGH.md` | After Lesson 3 — club code line by line |
| `CURATED_FOR_YOU_TASK.md` | Later — reference / full dumps |
| `CLUB_PROFILE_TASK.md` | Later — rules & checklist |
| `SETUP.md` | Only when you need to run the app |

**Rule:** One lesson per sitting (30–45 minutes). Close the laptop when the lesson ends. Confusion comes from reading 5 docs in parallel.

---

## Part 1 — C → React dictionary (learn this once)

| In C you know… | In React / TSX it is… |
|----------------|------------------------|
| A **function** that does work | A **component** — a function that returns UI |
| A **struct** with fields | A **props type** (`type FooProps = { ... }`) |
| Passing args to a function | Passing **props**: `<Badge variant="live">…</Badge>` |
| `printf` / writing to screen | **JSX** — HTML-looking syntax inside the function |
| `#include "header.h"` | `import { Badge } from "..."` |
| Calling `draw_card()` many times in a loop | `{items.map(... => <Card />)}` |
| Global config / strings file | `en.json` + `t("key")` (translations) |
| A pointer to something that changes | **state** (`useState`) — data that can update the screen |
| `main()` that starts the program | Browser URL → `App.tsx` route → a **Page** |

### The one mental model you need

In C:

```c
void print_badge(const char *text) {
    printf("[%s]\n", text);
}
```

In React (your real file `Badge.tsx`):

```tsx
export function Badge({ children, variant = "default" }: BadgeProps) {
  return <span className="...">{children}</span>;
}
```

Same idea: **function in → UI out**.  
`children` = “whatever you put between the tags,” like text inside the badge.

### What is `.tsx`?

- `.ts` = TypeScript (JavaScript + types, like C headers telling types of args)
- `.tsx` = TypeScript **plus** JSX (the HTML-looking parts)

You can ignore 80% of TypeScript at first. Read types as: “this function expects these fields.”

---

## Part 2 — How a page appears (5 steps)

```text
1. You type / open URL          e.g. /clubs  or  /discover
2. App.tsx looks at routes      like a switch/case on the path
3. It picks a Page              ClubPage  or  DiscoverPage
4. Page calls smaller pieces    Hero, Cards, Sections...
5. Browser paints HTML/CSS
```

Your two projects:

| Feature | Entry URL | “main” file |
|---------|-----------|-------------|
| Curated for You | `/discover` (section inside Discover) | `CuratedForYouSection.tsx` |
| Club profile | `/clubs` | `ClubPage.tsx` |

**Always start from the entry, then go down.** Never start from a random small file in the middle of the tree.

---

## Part 3 — Official reading order (follow this)

### Week mindset

- **First:** Curated for You (smaller, fewer files)  
- **Second:** Club page (bigger, same ideas + a bit of data loading)

---

### LESSON 1 — Vocabulary + map (30 min)

**Goal:** Know names. Do not understand every line yet.

1. Read **Part 1** of this guide again (C dictionary).  
2. Open `.local/CURATED_FOR_YOU_COMPONENTS.md`  
3. Only read sections **1–5** (big picture + created vs reused).  
4. On paper, write from memory:

```text
Created: Badge, Featured..., Curated..., CuratedForYouSection
Reused:  Button, t(), media helpers, ...
```

**Stop.** Do not open source files yet.

**Checkpoint question:**  
“What is the parent section, and which two card types does it contain?”  
Answer: `CuratedForYouSection` → `FeaturedEventCard` + `CuratedEventCard`.

---

### LESSON 2 — Smallest component: Badge (30 min)

**File to open (only this):**  
`frontend/src/components/shared/Badge.tsx`

**How to read it (like a teacher with you):**

1. Find `type BadgeProps` → this is your **struct** of inputs.  
2. Find `export function Badge(...)` → this is the function.  
3. Find `return (` → everything after is “what appears on screen.”  
4. Ignore long `className="..."` strings at first — that is CSS styling, not logic.

**C analogy:**

```c
typedef struct {
    char *children;   /* the text */
    char *variant;    /* "default" | "live" | "solid" */
} BadgeProps;

void Badge(BadgeProps p);  /* draws a pill */
```

**Exercise:** In the browser on Discover or Club, find a small pill label. That is Badge.

**Checkpoint:** Explain in one sentence: “Badge only shows text in a rounded pill; it is not a button.”

---

### LESSON 3 — One card: CuratedEventCard (40 min)

**File:** `frontend/src/components/discover/CuratedEventCard.tsx`

Read in this order inside the file:

1. `import` lines → “which helpers do I call?” (`Badge`, `resolveMediaUrl`)  
2. `type CuratedEventCardProps` → inputs (image, title, categoryLabel, timeLabel)  
3. Function body → compute `imageUrl`, then `return` the layout  
4. Find `<Badge>...</Badge>` → **calling** the function you learned in Lesson 2

**Exercise:** Cover the screen and say out loud:

> “Parent gives me title and labels. I draw a photo background and put Badge + title + time on top.”

**Do not** open FeaturedEventCard yet. Same pattern, more props.

---

### LESSON 4 — Parent section: CuratedForYouSection (40 min)

**File:** `frontend/src/components/discover/CuratedForYouSection.tsx`

This is the C equivalent of:

```c
void curated_for_you_section(void) {
    FeaturedEventCard(...);
    for (int i = 0; i < 2; i++)
        CuratedEventCard(items[i]);
}
```

Focus on:

1. `const curatedEvents = [ ... ]` → array of fake data  
2. `{t("discover....")}` → text from JSON, not hardcoded English  
3. `.map((event) => <CuratedEventCard ... />)` → loop that draws cards  

**Optional peek:** `en.json` → search `"curatedForYou"` — see the dictionary entry.

**Checkpoint:**  
“Why `.map()`? So we write CuratedEventCard once and reuse it for every item.”

---

### LESSON 5 — FeaturedEventCard (30 min)

**File:** `frontend/src/components/discover/FeaturedEventCard.tsx`

Same as CuratedEventCard, plus:

- `Button` for “Join Group” (existing component — we did not invent a new button)  
- `Users` icon + `t("discover.members", { count })`  

**Checkpoint:** List 3 reused things inside this file: Badge, Button, media helper.

---

### LESSON 6 — Rest day: run the app + point with your finger (20 min)

1. Run frontend.  
2. Open Discover.  
3. For each visible curated UI piece, say the **component name** out loud.  

No new files. This builds the map in your head.

---

### LESSON 7 — Club map only (30 min)

**Open:** `.local/CLUB_PROFILE_CODE_WALKTHROUGH.md`  
**Read only:** sections **0, 1, 2, 3** (big picture + reused + created list).

Draw on paper:

```text
ClubPage
  ClubHero
  ClubStatsRow → ClubStatCard × 3
  ClubUpcomingRides → ClubRideRow × N
  ClubRecruitingCard
  ClubMemberSpotlight
```

**Stop.** Do not read the long code dumps yet.

---

### LESSON 8 — Club from small to big (same order as Curated)

Open **one file per day** (or one per session):

| Order | File | Why |
|------:|------|-----|
| 1 | `ClubStatCard.tsx` | Smallest — like Badge |
| 2 | `ClubStatsRow.tsx` | Uses StatCard × 3 — like section |
| 3 | `ClubRideRow.tsx` | One row — like CuratedEventCard |
| 4 | `ClubUpcomingRides.tsx` | `.map()` over rides |
| 5 | `ClubHero.tsx` | Visual header |
| 6 | `ClubRecruitingCard.tsx` / `ClubMemberSpotlight.tsx` | Simple cards |
| 7 | `ClubPage.tsx` | Parent + data loading |
| 8 | `App.tsx` — only the `clubs` route line | How URL connects |

For ClubPage, when you see `useState` / `useEffect`:

- **useState** = “variables that redraw the screen when they change”  
- **useEffect** = “run this after paint / when language changes” ≈ init + update logic  

You do **not** need to master hooks before you can explain the page structure.

**Use the walkthrough doc** section-by-section that matches each file (Lesson 8 pairs with walkthrough steps D–K).

---

## Part 4 — How to read ANY of your files (method)

Every time you open a `.tsx` file, ask **only** these questions, in order:

1. **What is the name of the function?** (component name)  
2. **What props does it take?** (the type / struct)  
3. **What does it import?** (created by us vs already existed)  
4. **What does it return?** (describe the UI in words, ignore CSS classes)  
5. **Who calls it?** (parent page/section)

If you cannot answer #5, look one level up in the tree — do not dive into CSS.

---

## Part 5 — Two “exam” questions (when you feel ready)

### Exam A — Curated

Without looking:

1. Name the 4 things you created.  
2. Name 2 things you reused.  
3. Which file contains the `.map()` for small cards?

### Exam B — Club

Without looking:

1. Which file is the entry for `/clubs`?  
2. Why are club stats “fake”?  
3. What happens on RSVP if the ride has an `eventId`?

If you can answer these, you **understand** the projects — even if you still google syntax.

---

## Part 6 — What NOT to do (common traps)

| Trap | Better |
|------|--------|
| Reading `CURATED_FOR_YOU_TASK.md` full code dumps first | Read COMPONENTS map first, then one small `.tsx` |
| Trying to understand all Tailwind classes | Skip `className` until the structure is clear |
| Studying Club and Curated the same day at the start | Finish Curated lessons 1–6 first |
| Feeling stupid because AI wrote it | Pros read unfamiliar code daily — method beats memory |
| Editing while learning | Read-only until you can explain the tree |

---

## Part 7 — Your 2-week plan (simple)

| Day | Lesson |
|-----|--------|
| 1 | Lesson 1 |
| 2 | Lesson 2 (Badge) |
| 3 | Lesson 3 (CuratedEventCard) |
| 4 | Lesson 4 (Section) |
| 5 | Lesson 5 (Featured) + Lesson 6 (browser) |
| 6 | Rest or Exam A |
| 7 | Lesson 7 (Club map) |
| 8–12 | Lesson 8 files one by one |
| 13 | ClubPage + App route |
| 14 | Exam B + re-read this Part 4 method |

---

## Part 8 — Where the long docs fit

After you finish the lessons above:

- Use **`CLUB_PROFILE_CODE_WALKTHROUGH.md`** as a **reference** when a file confuses you (search the component name).  
- Use **`CURATED_FOR_YOU_TASK.md`** / **`CLUB_PROFILE_TASK.md`** when you need **why** we followed team rules (subject, no backend, no conflicts).  
- Use **`CURATED_FOR_YOU_COMPONENTS.md`** anytime you forget made vs reused.

---

## Closing — what “understanding” means here

You do **not** need to write React from scratch tomorrow.

You **do** need to be able to say:

> “This page calls these components. This card takes these props. This text comes from `t()`. This button is the shared `Button`. This list is a `.map()`.”

That is enough to defend your work in a review and to grow from C into frontend.

Start **tomorrow** with Lesson 1 only. One step. You already have the code — now you learn to **read** it.

# Landing (Welcome) Page

This is the page a **logged-out** visitor sees at `/` — for example after
clicking the "VIENNA ATHLETIC" logo in the header. 

If the visitor **is** logged in, they never see this page: `/` redirects
them straight to `/discover` instead.

## How `LandingPage.tsx` uses them

`LandingPage` (`src/pages/LandingPage.tsx`) doesn't hold any layout itself.
It only decides *which* page to show, based on auth state, then composes
the two visual pieces:

```tsx
export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="landing-page">
      <WelcomeHero />
      <CuratedExperiences />
    </div>
  );
}
```

## What each piece is (plain language)

| Name | File location | What it actually is |
|---|---|---|
| **LandingPage** | `src/pages/LandingPage.tsx` | The page itself, mounted at route `/`. Checks if you're logged in and either redirects you or shows the two sections below. |
| **WelcomeHero** | `src/components/landing/WelcomeHero.tsx` | The big full-screen banner at the top: background photo, "Move. Connect. Belong." headline, and the two buttons ("Explore Activities" / "Learn More"). |
| **CuratedExperiences** | `src/components/landing/CuratedExperiences.tsx` | The "Curated Experiences" section below the hero. Doesn't draw any card itself — it just picks the text/image for each of the 3 cards and hands it to `BentoImageCard` or `BentoInfoCard` below. |
| **BentoImageCard** | `src/components/landing/BentoImageCard.tsx` | A card with a photo background and a glass text panel on top. Reused twice: once big (`size="lg"`, the tennis card, with a tag + description + arrow button) and once small (`size="sm"`, the cycling card, just a title + arrow icon). |
| **BentoInfoCard** | `src/components/landing/BentoInfoCard.tsx` | The one card with no photo — plain background, a tag, a title, a description, and the little stack of "+12 people attending" circles (the running card). |

Same idea as the header: `CuratedExperiences` is the "layout" component
(like `Header.tsx`), and `BentoImageCard`/`BentoInfoCard` are the reusable
pieces it composes (like `HeaderBrand`/`HeaderNav`). The two photo cards
share one component instead of being copy-pasted, since they're the exact
same visual pattern at two sizes.

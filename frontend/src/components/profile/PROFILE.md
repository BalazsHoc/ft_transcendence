# Profile Page Structure

Page: `frontend/src/pages/ProfilePage.tsx`

Built from the `your_profile_desktop_dashboard` HTML mockup, including its
left sidebar nav (`ProfileSideNav`). Note this is in addition to the app's
existing top nav in `Header.tsx` — both are visible on this page, which is
different from the mockup (which had no top header at all).

## Layout

```
ProfilePage
├── ProfileSideNav          (nav links, sticky under the header, xl+ screens only)
└── content column
    ├── ProfileHero          (cover photo + avatar + name + Edit button)
    ├── ProfileEditForm       (only rendered while editing)
    └── grid
        ├── left column (8/12)
        │   ├── ProfileScoreCard
        │   └── ProfileActivityTimeline
        └── right column (4/12)
            ├── ProfileAbout
            └── ProfileAchievements
```

## Components

All in `frontend/src/components/profile/`:

| Component | File | Shows |
|---|---|---|
| `ProfileSideNav` | `ProfileSideNav.tsx` | Home/Discover/Map/My events/Chats/Profile links + Logout. Hidden below the `xl` breakpoint (1280px) |
| `ProfileHero` | `ProfileHero.tsx` | Cover photo, avatar, username, district, interest tags, "Edit profile" button |
| `ProfileEditForm` | `ProfileEditForm.tsx` | Avatar upload + district/languages/interests inputs, calls `updateMe()` |
| `ProfileScoreCard` | `ProfileScoreCard.tsx` | SVG ring gauge for a "community score" |
| `ProfileActivityTimeline` | `ProfileActivityTimeline.tsx` | List of recent activity |
| `ProfileAbout` | `ProfileAbout.tsx` | Languages + focus areas, from `user.languages` / `user.interests` |
| `ProfileAchievements` | `ProfileAchievements.tsx` | Badge grid |

`ProfileSideNav` uses real routes only (`/`, `/discover`, `/map`, `/my-events`,
`/chats`, `/profile`) and calls `useAuth().logout()` for the Logout button —
unlike the mockup's Home/Explore/Members/Settings links, which don't all map
to routes that exist in this app.

## Real data vs. placeholder

The `User` type (`src/types/api.ts`) only has `username`, `district`,
`languages`, `interests`, `avatar`, `created_at` — so:

- **Real, wired to the API**: avatar, username, district, languages, interests
  (via `useAuth().user`), edited through `ProfileEditForm` → `updateMe()`.
- **Placeholder, no backend yet**: score (`ProfileScoreCard`), activity
  (`ProfileActivityTimeline`), achievements (`ProfileAchievements`). Each
  accepts props with sane defaults (empty/zero), so wiring them to a real
  endpoint later is just passing a prop — no component rewrite needed.

## Reused (not rebuilt)

- `Button` (`components/shared/Button.tsx`) — Edit/Save/Cancel actions.
- `resolveMediaUrl` / `DEFAULT_AVATAR_SRC` (`utils/media.ts`) — avatar image.
- `useAuth()` (`features/auth/AuthContext.tsx`) — current user + `refreshMe()`.
- `ApiLog`, `FormCard.module.css` — same edit-form pattern as the old profile page.

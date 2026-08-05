# Profile Page — what belongs to which component

- Left sidebar (Home, Discover, Map, My events, Chats, Profile links + Logout button) → `ProfileSideNav`
  - Home icon + link → `ProfileSideNav`
  - Discover icon + link → `ProfileSideNav`
  - Map icon + link → `ProfileSideNav`
  - My events icon + link → `ProfileSideNav`
  - Chats icon + link → `ProfileSideNav`
  - Profile icon + link → `ProfileSideNav`
  - Logout icon + button → `ProfileSideNav`

- Top section (cover photo, avatar, username, district, interest tags) → `ProfileHero`
  - Location pin icon + district text → `ProfileHero`
  - "Edit profile" icon + button → `ProfileHero`

- Edit panel, only shown after clicking "Edit profile" → `ProfileEditForm`
  - Avatar file input → `ProfileEditForm`
  - District input → `ProfileEditForm`
  - Languages input → `ProfileEditForm`
  - Interests input → `ProfileEditForm`
  - "Save" button → `ProfileEditForm`
  - "Cancel" button → `ProfileEditForm`

- Friends management panel (search, requests, friend list and private message links) → `FriendsPanel`

- Activity History card (calendar icon + activity list / empty message) → `ProfileActivityTimeline`

- About card (Languages text + Focus Areas text) → `ProfileAbout`

- Achievements card (badge icons + labels grid) → `ProfileAchievements`
  - Medal icon (100 Workouts badge) → `ProfileAchievements`
  - Flame icon (30 Day Streak badge) → `ProfileAchievements`
  - Trophy icon (Court Master badge) → `ProfileAchievements`

All profile components are composed in `frontend/src/pages/UserProfilePage.tsx` (with
`ProfilePage.tsx` providing the current user's profile route).

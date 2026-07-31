# Club Profile — Component Ownership

Club profile page inspired by Velo Vienna. Backend has **no Club model** — identity/stats/recruiting/spotlight use fake data; upcoming rides may load real cycling events.

```text
ClubPage
├── ClubHero
├── ClubStatsRow
│   └── ClubStatCard (×3)
└── club-bento
    ├── ClubUpcomingRides
    │   └── ClubRideRow (mapped)
    ├── ClubRecruitingCard
    └── ClubMemberSpotlight
```

| Component | File | Shows |
|---|---|---|
| `ClubHero` | `ClubHero.tsx` | Cover, badges, name, blurb, Apply / View Schedule |
| `ClubStatCard` | `ClubStatCard.tsx` | One metric tile |
| `ClubStatsRow` | `ClubStatsRow.tsx` | Three stats |
| `ClubRideRow` | `ClubRideRow.tsx` | One upcoming ride + RSVP |
| `ClubUpcomingRides` | `ClubUpcomingRides.tsx` | List + See All |
| `ClubRecruitingCard` | `ClubRecruitingCard.tsx` | Recruiting CTA |
| `ClubMemberSpotlight` | `ClubMemberSpotlight.tsx` | Spotlight quote |

**Reuse:** `Button`, `Badge`, `eventsApi.getEvents` / `joinEvent`, CSS vars from `global.css`.

**Do not edit:** Header, Discover, Profile, Map, backend.

# Club-style Components — Ownership

There is no standalone Club page or Club model in the MVP. The reusable club-style components below are used by the group details page; the old `ClubPage.tsx` demo has been removed. Group identity/stats use real group data, while upcoming rides may load real events.

```text
GroupDetailsPage
├── ClubHero
├── ClubStatsRow
│   └── ClubStatCard (×3)
└── ClubUpcomingRides
    └── ClubRideRow (mapped)
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

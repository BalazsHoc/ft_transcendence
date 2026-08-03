Hey team — quick update from me on Groups.

I removed **Curated for You** from the Events/Discover screen. Groups shouldn’t live there anymore. Everything for groups is now on the **Groups** screen.

### Groups list (`/groups`)
All groups show on the Groups page now.
- The **big/featured card** shows more info and has a **Details** button (members on the left, Details on the right).
- The **smaller cards** don’t have that Details button — you just click the card itself.
- Clicking Details / the card takes you to **`/groups/:id`** (the group details page).
- I also changed the **date format** on the cards to something like `20 Jul 2026`.
- `/clubs` now just redirects to `/groups`.

### Group details
When you open a group you get a club-style page:
- **Back to groups** button on top of the cover
- Cover / hero with group info
- **Apply to Join** (if you’re not a member yet)
- Stats row:
  - **Active members** (shows `current/max` when the group has a capacity)
  - **Group type** (training / social / etc.)
  - **Owner** with **avatar** (if it’s you, it can link to your profile; we don’t have other-user public profiles yet)
- **Upcoming events** for that group underneath

### Apply to join the group (capacity / auth)
Groups can have a **member limit** (`max_members`; `0` = unlimited).
- If the group is **full**, Apply is hidden and we show a clear message: group is full
- If you’re **not logged in** and try to apply, we ask you to **Login** or **Register**
- If join policy is **approval**, you get a “request sent / waiting” message
- If it’s **invite only**, we show that too

### Joining / leaving upcoming events
On upcoming events:
- If you’re logged in, you can **Join event**
- If you want to leave, there’s an **in-app popup** asking for confirmation (not the ugly browser alert)
- If you’re **not logged in** and try to join, it tells you to **sign in or create an account**, with links to **Login** and **Register**

Important: joining a group event uses the normal event join API. It does **not** wait for Alex/owner approval.  
(Owner/approval stuff is for **joining the group itself**, depending on join policy — not for RSVP on the event.)  
If an **event** is full, backend puts you on the **waitlist**.

After you join an event, it can also show up in places like **My events** / chats, same as joining any other event.

### Missing: connect an event to a group in the UI
There is still **no UI** to attach an event to a group.
- Create Event still creates a normal standalone event
- I think we should add this on the **Events** side (optional group when creating an event), or a “create event for this group” on group details

Backend already supports it with:
`POST /api/groups/<group-id>/events/`

### What I did manually for demo
I added one demo event **“Football in Prater”** to **Prater Kickabout** manually in the backend (Django shell / DB), by creating the event and setting its `group` to that group, so Upcoming events isn’t empty for demos.

Also set up local demo data:
- 4 groups: Late Runners, Morning Flow Vienna, Prater Kickabout, Velo Vienna Crew
- covers / default group image
- demo user stuff in sqlite

### Branch / merge
First big Groups UI was on **`feature/groups-product-ui`** and **merged into `main`**.  
Follow-up (group full / apply messages) is again on **`feature/groups-product-ui`** — not merged to main yet until we review.

If anything feels unclear or you want the “link event ↔ group” UI next, tell me and we can plan it.

Thanks!

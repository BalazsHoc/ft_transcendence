# Learn your Groups code, in order

Read this from the top. Do not jump.

For every step: open the file, look at the code, then read the explanation here.

Do not start the next step until you can say, in your own words, what the last step did.

---

## Words you need (2 minutes)

The app has two parts:

- **Frontend** = what you see in the browser. React files in `frontend/`. **This is what you wrote.**
- **Backend** = the server that stores groups in the database. **Alex wrote this.** Your pages *call* it. You do not need to open Django files.

A **page** is one screen. `GroupsPage` is the list. `GroupDetailsPage` is one group.

A **component** is a small piece of a screen, like a card or a button. A page puts components together.

**State** is memory on the page. Example: “the list of groups I just loaded”. When state changes, React draws the screen again.

An **API function** is a small function that talks to the backend. Example: `getGroups()` means “please give me all groups”.

`t("something")` means “show this text in the current language”. The English/German/Ukrainian words live in json files. You do not need to memorize those files.

`className="..."` is only styling (size, color, spacing). Skip those. They do not change the logic.

---

## Step 1 — Click it first

Start the app. Log in. Click **Groups** in the header.

You should see:

1. Title “Groups”
2. A **Create group** button
3. One big photo card
4. Smaller photo cards under it

Click **Details** on the big card.

You should see:

1. Back button
2. Big cover photo, name, Apply or Leave
3. Three tiles: members, group type, owner
4. If you click members, a list of people
5. A chat box if you are a member — **not yours, ignore it**
6. Upcoming events with Join / Leave / Details

That is the whole product you built. Now we follow the same path in the code.

---

## Step 2 — How the URL opens your page

**Open:** `frontend/src/app/App.tsx`

This file is the map of the website. Each line says: this URL → this page.

You only care about these three lines:

```
path="clubs"     → send the user to /groups
path="groups"    → show GroupsPage          (the list)
path="groups/:groupId" → show GroupDetailsPage  (one group)
```

`:groupId` is a placeholder. If the URL is `/groups/abc-123`, then `groupId` is `abc-123`.

The header link “Groups” goes to `/groups`. The Details button goes to `/groups/` plus the group’s id.

**Say this:** When I click Groups, the router shows my list page. When I click Details, the router shows my details page with that group’s id.

---

## Step 3 — Why you did not build header and footer

**Open:** `frontend/src/layouts/AppLayout.tsx`

Every page sits inside this layout:

1. Header on top
2. `<Outlet />` in the middle — **this is where your page appears**
3. Footer at the bottom

So header and footer wrap Groups and Details automatically. You did not write them.

---

## Step 4 — The Groups list page, from the top

**Open:** `frontend/src/pages/GroupsPage.tsx`

Stay in this file until Step 4 is finished.

### 4.1 Imports (the shopping list at the top)

The file starts by bringing in tools it needs.

- `useState`, `useEffect`, `useCallback` — React tools for memory and “run this when the page opens”
- `useTranslation` — the `t()` function for text
- `getGroups`, `createGroup` — talk to the backend
- `GroupItem`, `GroupPayload` — the shape of a group (name, sport, members, …)
- `useSports` — list of sports for the create form dropdown
- `CuratedGroupCard` — **your card component**
- `Button` — shared button (not yours, just use it)
- `DEFAULT_GROUP_IMAGE_SRC` — fallback picture if a group has no cover

### 4.2 The empty form

`GroupFormState` lists every field in the create form: name, description, sport, levels, kind, visibility, join policy, max members, location.

`initialForm` is those fields with empty / default values. When the page loads, the form is empty. After a successful create, we put the form back to this.

### 4.3 Memory of the page (`useState`)

```
groups          = the list we got from the backend
form            = what the user typed in the create form
showForm        = is the form visible? yes/no
loading         = are we still waiting for the list?
submitting      = are we currently sending a new group?
coverImageFile  = the picture the user picked
error           = error message, or nothing
```

`const { t } = useTranslation()` — now you can write `t("groupsTest.title")` and the title appears in the right language.

`const sports = useSports()` — loads the sport list from the API (running, cycling, …). You did not write `useSports`. You only use the array it returns.

### 4.4 Loading the list

`loadGroups` does this, in order:

1. `setLoading(true)` — show “Loading…”
2. `setError(null)` — clear old errors
3. `setGroups(await getGroups())` — call the backend, save the result
4. If it fails, save an error message
5. `finally`: `setLoading(false)` — stop showing “Loading…”

`useCallback` means: keep this function stable so React does not recreate it every render. You do not need to explain `useCallback` deeper than that.

Then:

```
useEffect(() => {
  void loadGroups();
}, [loadGroups]);
```

This means: when the page opens, fetch the groups. That is why the list appears by itself. You do not click “Load”.

`void` just means “I know this is async, run it anyway”.

### 4.5 Typing in the form

`updateForm` runs every time the user types in an input.

The input has a `name`, for example `name="sport"`.  
The line `setForm((current) => ({ ...current, [name]: value }))` means: keep everything already in the form, and change only the field that was typed.

One function handles every text field. That is why each input has `onChange={updateForm}`.

The image field is special. It is a file, not text, so it has its own `onChange` that saves `event.target.files[0]` into `coverImageFile`.

### 4.6 Submitting a new group

`submitGroup` runs when the user clicks **Create group** on the form.

1. `event.preventDefault()` — do not reload the browser. Stay on this page.
2. Split `form.levels` by commas, trim spaces, drop empty pieces. The backend wants a list, not one string.
3. Turn `maxMembers` into a number.
4. `setSubmitting(true)` — disable the button / show “Creating…”
5. Call `createGroup({ ... })` with all the fields plus the image file.
6. If it works: empty the form, hide the form, call `loadGroups()` so the new group appears in the list.
7. If it fails: show an error.
8. `finally`: `setSubmitting(false)`.
# Learn your Groups code, in order

Read this from the top. Do not jump.

For every step: open the file, look at the code, then read the explanation here.

Do not start the next step until you can say, in your own words, what the last step did.

---

## Words you need (2 minutes)

The app has two parts:

- **Frontend** = what you see in the browser. React files in `frontend/`. **This is what you wrote.**
- **Backend** = the server that stores groups in the database. **Alex wrote this.** Your pages *call* it. You do not need to open Django files.

A **page** is one screen. `GroupsPage` is the list. `GroupDetailsPage` is one group.

A **component** is a small piece of a screen, like a card or a button. A page puts components together.

**State** is memory on the page. Example: “the list of groups I just loaded”. When state changes, React draws the screen again.

An **API function** is a small function that talks to the backend. Example: `getGroups()` means “please give me all groups”.

`t("something")` means “show this text in the current language”. The English/German/Ukrainian words live in json files. You do not need to memorize those files.

`className="..."` is only styling (size, color, spacing). Skip those. They do not change the logic.

---

## Step 1 — Click it first

Start the app. Log in. Click **Groups** in the header.

You should see:

1. Title “Groups”
2. A **Create group** button
3. One big photo card
4. Smaller photo cards under it

Click **Details** on the big card.

You should see:

1. Back button
2. Big cover photo, name, Apply or Leave
3. Three tiles: members, group type, owner
4. If you click members, a list of people
5. A chat box if you are a member — **not yours, ignore it**
6. Upcoming events with Join / Leave / Details

That is the whole product you built. Now we follow the same path in the code.

---

## Step 2 — How the URL opens your page

**Open:** `frontend/src/app/App.tsx`

This file is the map of the website. Each line says: this URL → this page.

You only care about these three lines:

```
path="clubs"     → send the user to /groups
path="groups"    → show GroupsPage          (the list)
path="groups/:groupId" → show GroupDetailsPage  (one group)
```

`:groupId` is a placeholder. If the URL is `/groups/abc-123`, then `groupId` is `abc-123`.

The header link “Groups” goes to `/groups`. The Details button goes to `/groups/` plus the group’s id.

**Say this:** When I click Groups, the router shows my list page. When I click Details, the router shows my details page with that group’s id.

---

## Step 3 — Why you did not build header and footer

**Open:** `frontend/src/layouts/AppLayout.tsx`

Every page sits inside this layout:

1. Header on top
2. `<Outlet />` in the middle — **this is where your page appears**
3. Footer at the bottom

So header and footer wrap Groups and Details automatically. You did not write them.

---

## Step 4 — The Groups list page, from the top

**Open:** `frontend/src/pages/GroupsPage.tsx`

Stay in this file until Step 4 is finished.

### 4.1 Imports (the shopping list at the top)

The file starts by bringing in tools it needs.

- `useState`, `useEffect`, `useCallback` — React tools for memory and “run this when the page opens”
- `useTranslation` — the `t()` function for text
- `getGroups`, `createGroup` — talk to the backend
- `GroupItem`, `GroupPayload` — the shape of a group (name, sport, members, …)
- `useSports` — list of sports for the create form dropdown
- `CuratedGroupCard` — **your card component**
- `Button` — shared button (not yours, just use it)
- `DEFAULT_GROUP_IMAGE_SRC` — fallback picture if a group has no cover

### 4.2 The empty form

`GroupFormState` lists every field in the create form: name, description, sport, levels, kind, visibility, join policy, max members, location.

`initialForm` is those fields with empty / default values. When the page loads, the form is empty. After a successful create, we put the form back to this.

### 4.3 Memory of the page (`useState`)

```
groups          = the list we got from the backend
form            = what the user typed in the create form
showForm        = is the form visible? yes/no
loading         = are we still waiting for the list?
submitting      = are we currently sending a new group?
coverImageFile  = the picture the user picked
error           = error message, or nothing
```

`const { t } = useTranslation()` — now you can write `t("groupsTest.title")` and the title appears in the right language.

`const sports = useSports()` — loads the sport list from the API (running, cycling, …). You did not write `useSports`. You only use the array it returns.

### 4.4 Loading the list

`loadGroups` does this, in order:

1. `setLoading(true)` — show “Loading…”
2. `setError(null)` — clear old errors
3. `setGroups(await getGroups())` — call the backend, save the result
4. If it fails, save an error message
5. `finally`: `setLoading(false)` — stop showing “Loading…”

`useCallback` means: keep this function stable so React does not recreate it every render. You do not need to explain `useCallback` deeper than that.

Then:

```
useEffect(() => {
  void loadGroups();
}, [loadGroups]);
```

This means: when the page opens, fetch the groups. That is why the list appears by itself. You do not click “Load”.

`void` just means “I know this is async, run it anyway”.

### 4.5 Typing in the form

`updateForm` runs every time the user types in an input.

The input has a `name`, for example `name="sport"`.  
The line `setForm((current) => ({ ...current, [name]: value }))` means: keep everything already in the form, and change only the field that was typed.

One function handles every text field. That is why each input has `onChange={updateForm}`.

The image field is special. It is a file, not text, so it has its own `onChange` that saves `event.target.files[0]` into `coverImageFile`.

### 4.6 Submitting a new group

`submitGroup` runs when the user clicks **Create group** on the form.

1. `event.preventDefault()` — do not reload the browser. Stay on this page.
2. Split `form.levels` by commas, trim spaces, drop empty pieces. The backend wants a list, not one string.
3. Turn `maxMembers` into a number.
4. `setSubmitting(true)` — disable the button / show “Creating…”
5. Call `createGroup({ ... })` with all the fields plus the image file.
6. If it works: empty the form, hide the form, call `loadGroups()` so the new group appears in the list.
7. If it fails: show an error.
8. `finally`: `setSubmitting(false)`.

### 4.7 What the screen draws (`return`)

React draws from top to bottom.

**Title row**

- `t("groupsTest.title")` — “Groups”
- `t("groupsTest.description")` — short subtitle
- The button: if `showForm` is true, the label is Cancel. If false, the label is Create group.
- Clicking the button flips `showForm`: `setShowForm((visible) => !visible)`

**The form**

`{showForm && ( <form ...> )}` means: draw the form only if `showForm` is true.

`onSubmit={submitGroup}` — pressing Enter or the submit button runs `submitGroup`.

Each field:

- `name="..."` matches a key in `form`
- `value={form....}` shows what is currently in state
- `onChange={updateForm}` writes back to state

Sport dropdown: `sports.map(...)` creates one `<option>` per sport from the API.

Submit button is disabled while submitting, or if no sport is chosen, or if sports have not loaded yet.

**Error / loading / empty / cards**

- If `error` exists, show it.
- If `loading` is true, show “Loading groups…”
- Else if the list is empty, show “No groups found.”
- Else show the cards.

**The cards**

First group in the array → one big card:

```
groups[0]  →  CuratedGroupCard  variant="featured"
detailsTo={`/groups/${groups[0].id}`}
```

You pass the data in:

- picture (or default picture)
- name
- description
- sport label
- first level, if any
- member count
- location
- the Details URL

Everyone after the first:

```
groups.slice(1)  →  many CuratedGroupCard  variant="compact"
```

`slice(1)` means “skip index 0, take the rest”.

`key={group.id}` is a React requirement for lists. It is not visible. It helps React know which card is which.

**Say this:** This page fetches all groups, can create a new one, and shows the first group big and the others small. Details goes to `/groups/` plus the id.

You are done with `GroupsPage.tsx`.

---

## Step 5 — The card you created

**Open:** `frontend/src/components/discover/CuratedGroupCard.tsx`

This file does **not** load groups. The page already did that. This file only **draws** one card.

### 5.1 What it receives (props)

The page passes:

- `variant` — `"featured"` (big) or `"compact"` (small). Default is featured.
- `image`, `title`, `description`, `categoryLabel`, `levelLabel`
- `memberCount`, `timeLabel` (we use location as timeLabel on Groups)
- `detailsTo` — where Details should go, example `/groups/abc`
- `className` — extra size from the page

`dateAt` exists because Discover also uses this card. On Groups you do not pass `dateAt`. Ignore it for Groups.

### 5.2 Setup inside the card

`useNavigate()` lets the card change the URL when you click.

`resolveMediaUrl(image, DEFAULT_GROUP_IMAGE_SRC)` turns the backend image path into a real URL. If something is wrong, use the default picture.

### 5.3 Compact card (the small ones)

If `variant === "compact"`, return early with the small layout.

The whole card is clickable:

```
onClick → navigate(detailsTo)
```

Keyboard: Enter or Space also navigates. That is so you can use the card without a mouse.

It shows:

- background photo
- dark overlay so white text is readable
- sport badge
- title
- member count with a people icon

There is **no** Details button. Clicking anywhere on the small card opens details.

### 5.4 Featured card (the big one)

If it is not compact, this is the big card.

Same idea: photo, dark gradient, text on top.

It also shows description, optional second badge (level), member count, and a real **Details** button.

The button:

```
onClick={() => navigate(detailsTo)}
```

That is the click that opens `GroupDetailsPage`.

**Say this:** I made one card with two looks. The list page fills it with group data. Featured has a Details button. Compact: the whole card is the button.

You are done with the list. Next is details.

---

## Step 6 — The phone to the backend

**Open:** `frontend/src/api/groupsApi.ts`

You do not need every helper. You need the names of the calls.

Think of this file as a phone book:

- `getGroups()` — GET all groups — used by the list
- `createGroup(...)` — POST a new group — used by the form
- `getGroup(id)` — GET one group — used by details
- `joinGroup(id)` — POST join — Apply button
- `leaveGroup(id)` — POST leave — Leave button
- `getGroupEvents(id)` — GET that group’s events — upcoming list

`createGroup` sends `FormData` instead of JSON because there can be an image file. That is why `toGroupFormData` exists. You do not need to recite that function.

The real saving in the database happens in Alex’s backend. Your job is: call these functions, then update the screen.

**Say this:** My pages never talk to Django directly. They call `groupsApi`.

---

## Step 7 — Group details, from the top

**Open:** `frontend/src/pages/GroupDetailsPage.tsx`

This is the long file. We go from the top, in order. Skip `GroupChat` when we reach it.

### 7.1 Why it looks like a “club”

You first built a Club page as a UI. Later Groups became the real feature. `/clubs` now redirects to `/groups`.

So this page **reuses** club pieces. You did not copy-paste a new hero. You pass group data into:

- `ClubHero` — cover, name, Apply / Leave
- `ClubStatsRow` — the three tiles
- `ClubUpcomingRides` — the event list

You do **not** need to explain those files line by line. You need to explain **what you pass into them**, which is in *this* file.

`GroupMembersList` is new, and yours. We open it in Step 8.

`GroupChat` is Alex. Skip it.

### 7.2 Small helpers at the top of the file

`levelLabel` — turn `beginner` into the translated word.

`kindLabel` — turn `training` / `social` / `competitive` / `team` into a readable label for the middle tile.

`eventToRide` — this is important.

The club event row does not understand a raw backend event. It wants a simpler object: day, month, time, title, whether you already joined.

`eventToRide` takes one event from the API and returns that simpler object. Then the reused list can draw it.

It also copies:

- are you attending or on the waitlist?
- how many people are attending?
- max slots (for “event full”)

### 7.3 Who is looking, and what we remember

```
useParams()     → groupId from the URL
useNavigate()   → go back to /groups, or to login, or to an event
useAuth()       → the logged-in user, or nobody
```

State, in plain language:

- `group` — the group we loaded, or still nothing
- `rides` — upcoming events, already converted by `eventToRide`
- `loadingGroup` / `loadingEvents` — spinners
- `error` — could not load the group
- `joining` / `leaving` — Apply or Leave is in progress
- `leaveConfirmOpen` — show “are you sure you want to leave?”
- `applyError` / `applyNeedsAuth` / `applySuccess` — messages under the hero
- `rsvpBusyId` / `rsvpError` / `rsvpInfo` / `rsvpNeedsAuth` — messages for joining an *event*
- `membersOpen` — is the member list expanded?

`applyErrorTimer` — a timer so the red “group is full” message disappears after 3.5 seconds.

The first `useEffect` only cleans that timer if you leave the page. Do not overthink it.

`showApplyError(message)` — show the message, then hide it after 3.5 seconds.

### 7.4 Load the group

The next `useEffect` runs when `groupId` changes (when you open details).

1. If there is no id, stop.
2. `cancelled = false` — if you click away before the request finishes, we ignore the late answer. That avoids a bug where an old group overwrites a new one.
3. Call `getGroup(groupId)`.
4. Success → `setGroup(data)`
5. Fail → `setError(...)`
6. Always → `setLoadingGroup(false)`
7. Cleanup: `cancelled = true`

### 7.5 Load the events

Same pattern, but `getGroupEvents(groupId)`.

Success → map every event through `eventToRide` → `setRides(...)`  
Fail → empty list (the page still works, just no events)

It also clears old RSVP messages, because you are looking at a (maybe new) group.

### 7.6 Apply to the group (`handleApply`)

This is the Apply button.

1. If there is no id, or we are already joining, stop (do not double-click).
2. If there is no logged-in user → show “please sign in” (`applyNeedsAuth = true`). Stop.
3. If the group has a max and it is already full → show “group is full”. Stop.
4. Call `joinGroup(groupId)`.
5. Call `getGroup` again so member count and membership update.
6. If the backend says status `pending` → “waiting for approval”. Else → “you’re in”.
7. If the backend returns an error, we read the message:
   - looks like “not logged in” → sign-in prompt
   - looks like “member limit” → group full
   - looks like “invite only” → invite-only message
   - anything else → show the raw error
8. `finally`: `joining = false`

### 7.7 Leave the group (`handleLeaveGroup`)

1. Close the confirm popup.
2. Call `leaveGroup(groupId)`.
3. Reload the group with `getGroup`.
4. Show “you left”.
5. If it fails, show an error.

The owner cannot reach this function from the UI. We hide Leave for the owner. That comes a bit later with `canLeaveGroup`.

### 7.8 Join / leave a group *event* (`handleRsvp`)

This is not joining the group. This is joining one event in the upcoming list.

1. If this row has no event id, or another click is already running, stop.
2. Not logged in → ask to sign in.
3. If you are already attending or waiting → this click means **leave**.
4. Leave: `leaveEvent`, then update that one row in `rides` (status empty, count minus one if you were attending).
5. Join: `joinEvent`. Status becomes attending or waiting. If attending, count plus one. If waiting, show waitlist text.
6. Auth error → sign in. Other error → red message.
7. Clear `rsvpBusyId` so the button works again.

Updating `rides` in the page means the list changes immediately, without reloading the whole group.

### 7.9 Early returns (no group yet)

If `error` — show the error and a Back button.  
If still loading, or `group` is still null — show “Loading group…”

After that, we know `group` exists. The rest of the file can use `group.name` safely.

### 7.10 Decisions before drawing

These lines decide which buttons you see. Learn them. Evaluators will ask this.

- `ownerName` — first + last name, or username
- `isOwnProfile` — am I the owner? then the owner tile links to `/profile`, else to `/users/id`
- `alreadyMember` — do I have any membership? (active or pending)
- `isActiveMember` — membership status is `active`
- `isGroupOwner` — my role is `owner`
- `canLeaveGroup` — I am a member, but not the owner
- `isPending` — I applied, waiting for approval
- `isFull` — there is a max, and we reached it
- `membersLabel` — `12/20` or `12/∞` if max is 0 (unlimited)
- `activeMemberships` — only people with status `active`, for the list

### 7.11 The screen, top to bottom

**Back button** — `navigate("/groups")`

**ClubHero** — you fill it with this group:

- cover, name, description, sport, city
- `showApply={!alreadyMember}` — Apply only if I am not in the group
- `showLeave={canLeaveGroup}` — Leave only if I can leave
- if full, Apply looks disabled and the label is “Group full”
- Leave click → open confirm dialog (does not leave yet)
- Apply click:
  - if already member or currently joining → do nothing
  - if full → show full error
  - else → `handleApply`

**ConfirmDialog** — “Leave this group?” Yes runs `handleLeaveGroup`. Cancel closes it.

**Message box** — only if there is something to say:

- need auth → Login and Register links
- apply error in red
- success text
- or pending text

**ClubStatsRow** — three tiles:

- members number, click toggles `membersOpen`
- group type (`kindLabel`)
- owner name + photo, link to profile

**GroupMembersList** — only if `membersOpen` is true. Step 8.

**GroupChat** — only if `isActiveMember`. **Not your code. Skip.**

**ClubUpcomingRides** — the event list:

- `rides` and `loading`
- `onRsvp={isActiveMember ? handleRsvp : undefined}`  
  If you are not an active member, we pass nothing. The Join buttons do not appear. You can still look at events.
- title: “Upcoming events”
- if I am the owner, extra button: Create group event → `/events/new?groupId=...`
- the rsvp error / info / sign-in flags

Each row also has a Details button inside the reused `ClubRideRow`. That goes to `/events/:eventId`. That is the **event** page, not this page. Do not explain event chat.

**Say this:** Details loads one group and its events. I reused the club layout. I wrote apply, leave, and event join logic. Chat is not mine. Only active members can join events from this page.

---

## Step 8 — The member list you created

**Open:** `frontend/src/components/groups/GroupMembersList.tsx`

The details page already filtered to **active** members. This component only displays them.

`ROLE_ORDER` — owner first, then admin, then member.

`memberName` — first + last, or username.

`roleLabel` — translated word for the role.

Then we copy the array and sort it: by role, then by join date.

If the list is empty, show “No active members yet.”

Otherwise, for each person:

- avatar (or default avatar if the image fails)
- name
- role
- click → `/profile` if it is me, else `/users/their-id`

**Say this:** Clicking the members tile opens my list. I sort by role and link each person to their profile.

---

## Step 9 — What a group looks like in data

**Open:** `frontend/src/types/api.ts`

Find `GroupItem`. You do not read the whole types file.

The fields you actually use:

- `id`, `name`, `description`, `sport`, `kind`
- `cover_image`, `location_name`
- `member_count`, `max_members`
- `owner` — who created the group
- `current_user_membership` — **me**, or `null` if I am not in the group  
  This is how Apply vs Leave is decided.
- `memberships` — everybody, for the member list

`current_user_membership.status` is `"active"` or `"pending"`.  
`current_user_membership.role` is `"owner"`, `"admin"`, or `"member"`.

---

## Files you created for these two screens

1. `frontend/src/pages/GroupsPage.tsx` — the list
2. `frontend/src/components/discover/CuratedGroupCard.tsx` — the cards
3. `frontend/src/pages/GroupDetailsPage.tsx` — details (except chat)
4. `frontend/src/components/groups/GroupMembersList.tsx` — the people list

You reused (do not explain unless asked): `ClubHero`, `ClubStatsRow`, `ClubUpcomingRides`, `ClubRideRow`, `Button`, `ConfirmDialog`.

Not yours: Header, Footer, `GroupChat`, the Django groups app.

There is also `GroupCard.tsx`. The live list does **not** use it. Ignore it.

---

## After you finish all steps — one paragraph for eval

Practice this out loud:

> I implemented the Groups list and the group details page. The list calls `getGroups`, shows a create form, and renders groups with `CuratedGroupCard`. The first group is a big featured card with a Details button. The others are compact cards. Details goes to `/groups/:id`. On details I load `getGroup` and `getGroupEvents`. I reused the club hero, stats, and upcoming-events layout, and I wrote apply, leave, and event join. Members opens `GroupMembersList`. Header, footer, and group chat are not mine. The backend groups API is Alex’s. I call it from `groupsApi.ts`.

If you cannot say that without reading, start again at Step 4, then Step 7. Those two files are the whole eval.


- `t("groupsTest.title")` — “Groups”
- `t("groupsTest.description")` — short subtitle
- The button: if `showForm` is true, the label is Cancel. If false, the label is Create group.
- Clicking the button flips `showForm`: `setShowForm((visible) => !visible)`

**The form**

`{showForm && ( <form ...> )}` means: draw the form only if `showForm` is true.

`onSubmit={submitGroup}` — pressing Enter or the submit button runs `submitGroup`.

Each field:

- `name="..."` matches a key in `form`
- `value={form....}` shows what is currently in state
- `onChange={updateForm}` writes back to state

Sport dropdown: `sports.map(...)` creates one `<option>` per sport from the API.

Submit button is disabled while submitting, or if no sport is chosen, or if sports have not loaded yet.

**Error / loading / empty / cards**

- If `error` exists, show it.
- If `loading` is true, show “Loading groups…”
- Else if the list is empty, show “No groups found.”
- Else show the cards.

**The cards**

First group in the array → one big card:

```
groups[0]  →  CuratedGroupCard  variant="featured"
detailsTo={`/groups/${groups[0].id}`}
```

You pass the data in:

- picture (or default picture)
- name
- description
- sport label
- first level, if any
- member count
- location
- the Details URL

Everyone after the first:

```
groups.slice(1)  →  many CuratedGroupCard  variant="compact"
```

`slice(1)` means “skip index 0, take the rest”.

`key={group.id}` is a React requirement for lists. It is not visible. It helps React know which card is which.

**Say this:** This page fetches all groups, can create a new one, and shows the first group big and the others small. Details goes to `/groups/` plus the id.

You are done with `GroupsPage.tsx`.

---

## Step 5 — The card you created

**Open:** `frontend/src/components/discover/CuratedGroupCard.tsx`

This file does **not** load groups. The page already did that. This file only **draws** one card.

### 5.1 What it receives (props)

The page passes:

- `variant` — `"featured"` (big) or `"compact"` (small). Default is featured.
- `image`, `title`, `description`, `categoryLabel`, `levelLabel`
- `memberCount`, `timeLabel` (we use location as timeLabel on Groups)
- `detailsTo` — where Details should go, example `/groups/abc`
- `className` — extra size from the page

`dateAt` exists because Discover also uses this card. On Groups you do not pass `dateAt`. Ignore it for Groups.

### 5.2 Setup inside the card

`useNavigate()` lets the card change the URL when you click.

`resolveMediaUrl(image, DEFAULT_GROUP_IMAGE_SRC)` turns the backend image path into a real URL. If something is wrong, use the default picture.

### 5.3 Compact card (the small ones)

If `variant === "compact"`, return early with the small layout.

The whole card is clickable:

```
onClick → navigate(detailsTo)
```

Keyboard: Enter or Space also navigates. That is so you can use the card without a mouse.

It shows:

- background photo
- dark overlay so white text is readable
- sport badge
- title
- member count with a people icon

There is **no** Details button. Clicking anywhere on the small card opens details.

### 5.4 Featured card (the big one)

If it is not compact, this is the big card.

Same idea: photo, dark gradient, text on top.

It also shows description, optional second badge (level), member count, and a real **Details** button.

The button:

```
onClick={() => navigate(detailsTo)}
```

That is the click that opens `GroupDetailsPage`.

**Say this:** I made one card with two looks. The list page fills it with group data. Featured has a Details button. Compact: the whole card is the button.

You are done with the list. Next is details.

---

## Step 6 — The phone to the backend

**Open:** `frontend/src/api/groupsApi.ts`

You do not need every helper. You need the names of the calls.

Think of this file as a phone book:

- `getGroups()` — GET all groups — used by the list
- `createGroup(...)` — POST a new group — used by the form
- `getGroup(id)` — GET one group — used by details
- `joinGroup(id)` — POST join — Apply button
- `leaveGroup(id)` — POST leave — Leave button
- `getGroupEvents(id)` — GET that group’s events — upcoming list

`createGroup` sends `FormData` instead of JSON because there can be an image file. That is why `toGroupFormData` exists. You do not need to recite that function.

The real saving in the database happens in Alex’s backend. Your job is: call these functions, then update the screen.

**Say this:** My pages never talk to Django directly. They call `groupsApi`.

---

## Step 7 — Group details, from the top

**Open:** `frontend/src/pages/GroupDetailsPage.tsx`

This is the long file. We go from the top, in order. Skip `GroupChat` when we reach it.

### 7.1 Why it looks like a “club”

You first built a Club page as a UI. Later Groups became the real feature. `/clubs` now redirects to `/groups`.

So this page **reuses** club pieces. You did not copy-paste a new hero. You pass group data into:

- `ClubHero` — cover, name, Apply / Leave
- `ClubStatsRow` — the three tiles
- `ClubUpcomingRides` — the event list

You do **not** need to explain those files line by line. You need to explain **what you pass into them**, which is in *this* file.

`GroupMembersList` is new, and yours. We open it in Step 8.

`GroupChat` is Alex. Skip it.

### 7.2 Small helpers at the top of the file

`levelLabel` — turn `beginner` into the translated word.

`kindLabel` — turn `training` / `social` / `competitive` / `team` into a readable label for the middle tile.

`eventToRide` — this is important.

The club event row does not understand a raw backend event. It wants a simpler object: day, month, time, title, whether you already joined.

`eventToRide` takes one event from the API and returns that simpler object. Then the reused list can draw it.

It also copies:

- are you attending or on the waitlist?
- how many people are attending?
- max slots (for “event full”)

### 7.3 Who is looking, and what we remember

```
useParams()     → groupId from the URL
useNavigate()   → go back to /groups, or to login, or to an event
useAuth()       → the logged-in user, or nobody
```

State, in plain language:

- `group` — the group we loaded, or still nothing
- `rides` — upcoming events, already converted by `eventToRide`
- `loadingGroup` / `loadingEvents` — spinners
- `error` — could not load the group
- `joining` / `leaving` — Apply or Leave is in progress
- `leaveConfirmOpen` — show “are you sure you want to leave?”
- `applyError` / `applyNeedsAuth` / `applySuccess` — messages under the hero
- `rsvpBusyId` / `rsvpError` / `rsvpInfo` / `rsvpNeedsAuth` — messages for joining an *event*
- `membersOpen` — is the member list expanded?

`applyErrorTimer` — a timer so the red “group is full” message disappears after 3.5 seconds.

The first `useEffect` only cleans that timer if you leave the page. Do not overthink it.

`showApplyError(message)` — show the message, then hide it after 3.5 seconds.

### 7.4 Load the group

The next `useEffect` runs when `groupId` changes (when you open details).

1. If there is no id, stop.
2. `cancelled = false` — if you click away before the request finishes, we ignore the late answer. That avoids a bug where an old group overwrites a new one.
3. Call `getGroup(groupId)`.
4. Success → `setGroup(data)`
5. Fail → `setError(...)`
6. Always → `setLoadingGroup(false)`
7. Cleanup: `cancelled = true`

### 7.5 Load the events

Same pattern, but `getGroupEvents(groupId)`.

Success → map every event through `eventToRide` → `setRides(...)`  
Fail → empty list (the page still works, just no events)

It also clears old RSVP messages, because you are looking at a (maybe new) group.

### 7.6 Apply to the group (`handleApply`)

This is the Apply button.

1. If there is no id, or we are already joining, stop (do not double-click).
2. If there is no logged-in user → show “please sign in” (`applyNeedsAuth = true`). Stop.
3. If the group has a max and it is already full → show “group is full”. Stop.
4. Call `joinGroup(groupId)`.
5. Call `getGroup` again so member count and membership update.
6. If the backend says status `pending` → “waiting for approval”. Else → “you’re in”.
7. If the backend returns an error, we read the message:
   - looks like “not logged in” → sign-in prompt
   - looks like “member limit” → group full
   - looks like “invite only” → invite-only message
   - anything else → show the raw error
8. `finally`: `joining = false`

### 7.7 Leave the group (`handleLeaveGroup`)

1. Close the confirm popup.
2. Call `leaveGroup(groupId)`.
3. Reload the group with `getGroup`.
4. Show “you left”.
5. If it fails, show an error.

The owner cannot reach this function from the UI. We hide Leave for the owner. That comes a bit later with `canLeaveGroup`.

### 7.8 Join / leave a group *event* (`handleRsvp`)

This is not joining the group. This is joining one event in the upcoming list.

1. If this row has no event id, or another click is already running, stop.
2. Not logged in → ask to sign in.
3. If you are already attending or waiting → this click means **leave**.
4. Leave: `leaveEvent`, then update that one row in `rides` (status empty, count minus one if you were attending).
5. Join: `joinEvent`. Status becomes attending or waiting. If attending, count plus one. If waiting, show waitlist text.
6. Auth error → sign in. Other error → red message.
7. Clear `rsvpBusyId` so the button works again.

Updating `rides` in the page means the list changes immediately, without reloading the whole group.

### 7.9 Early returns (no group yet)

If `error` — show the error and a Back button.  
If still loading, or `group` is still null — show “Loading group…”

After that, we know `group` exists. The rest of the file can use `group.name` safely.

### 7.10 Decisions before drawing

These lines decide which buttons you see. Learn them. Evaluators will ask this.

- `ownerName` — first + last name, or username
- `isOwnProfile` — am I the owner? then the owner tile links to `/profile`, else to `/users/id`
- `alreadyMember` — do I have any membership? (active or pending)
- `isActiveMember` — membership status is `active`
- `isGroupOwner` — my role is `owner`
- `canLeaveGroup` — I am a member, but not the owner
- `isPending` — I applied, waiting for approval
- `isFull` — there is a max, and we reached it
- `membersLabel` — `12/20` or `12/∞` if max is 0 (unlimited)
- `activeMemberships` — only people with status `active`, for the list

### 7.11 The screen, top to bottom

**Back button** — `navigate("/groups")`

**ClubHero** — you fill it with this group:

- cover, name, description, sport, city
- `showApply={!alreadyMember}` — Apply only if I am not in the group
- `showLeave={canLeaveGroup}` — Leave only if I can leave
- if full, Apply looks disabled and the label is “Group full”
- Leave click → open confirm dialog (does not leave yet)
- Apply click:
  - if already member or currently joining → do nothing
  - if full → show full error
  - else → `handleApply`

**ConfirmDialog** — “Leave this group?” Yes runs `handleLeaveGroup`. Cancel closes it.

**Message box** — only if there is something to say:

- need auth → Login and Register links
- apply error in red
- success text
- or pending text

**ClubStatsRow** — three tiles:

- members number, click toggles `membersOpen`
- group type (`kindLabel`)
- owner name + photo, link to profile

**GroupMembersList** — only if `membersOpen` is true. Step 8.

**GroupChat** — only if `isActiveMember`. **Not your code. Skip.**

**ClubUpcomingRides** — the event list:

- `rides` and `loading`
- `onRsvp={isActiveMember ? handleRsvp : undefined}`  
  If you are not an active member, we pass nothing. The Join buttons do not appear. You can still look at events.
- title: “Upcoming events”
- if I am the owner, extra button: Create group event → `/events/new?groupId=...`
- the rsvp error / info / sign-in flags

Each row also has a Details button inside the reused `ClubRideRow`. That goes to `/events/:eventId`. That is the **event** page, not this page. Do not explain event chat.

**Say this:** Details loads one group and its events. I reused the club layout. I wrote apply, leave, and event join logic. Chat is not mine. Only active members can join events from this page.

---

## Step 8 — The member list you created

**Open:** `frontend/src/components/groups/GroupMembersList.tsx`

The details page already filtered to **active** members. This component only displays them.

`ROLE_ORDER` — owner first, then admin, then member.

`memberName` — first + last, or username.

`roleLabel` — translated word for the role.

Then we copy the array and sort it: by role, then by join date.

If the list is empty, show “No active members yet.”

Otherwise, for each person:

- avatar (or default avatar if the image fails)
- name
- role
- click → `/profile` if it is me, else `/users/their-id`

**Say this:** Clicking the members tile opens my list. I sort by role and link each person to their profile.

---

## Step 9 — What a group looks like in data

**Open:** `frontend/src/types/api.ts`

Find `GroupItem`. You do not read the whole types file.

The fields you actually use:

- `id`, `name`, `description`, `sport`, `kind`
- `cover_image`, `location_name`
- `member_count`, `max_members`
- `owner` — who created the group
- `current_user_membership` — **me**, or `null` if I am not in the group  
  This is how Apply vs Leave is decided.
- `memberships` — everybody, for the member list

`current_user_membership.status` is `"active"` or `"pending"`.  
`current_user_membership.role` is `"owner"`, `"admin"`, or `"member"`.

---

## Files you created for these two screens

1. `frontend/src/pages/GroupsPage.tsx` — the list
2. `frontend/src/components/discover/CuratedGroupCard.tsx` — the cards
3. `frontend/src/pages/GroupDetailsPage.tsx` — details (except chat)
4. `frontend/src/components/groups/GroupMembersList.tsx` — the people list

You reused (do not explain unless asked): `ClubHero`, `ClubStatsRow`, `ClubUpcomingRides`, `ClubRideRow`, `Button`, `ConfirmDialog`.

Not yours: Header, Footer, `GroupChat`, the Django groups app.

There is also `GroupCard.tsx`. The live list does **not** use it. Ignore it.

---

## After you finish all steps — one paragraph for eval

Practice this out loud:

> I implemented the Groups list and the group details page. The list calls `getGroups`, shows a create form, and renders groups with `CuratedGroupCard`. The first group is a big featured card with a Details button. The others are compact cards. Details goes to `/groups/:id`. On details I load `getGroup` and `getGroupEvents`. I reused the club hero, stats, and upcoming-events layout, and I wrote apply, leave, and event join. Members opens `GroupMembersList`. Header, footer, and group chat are not mine. The backend groups API is Alex’s. I call it from `groupsApi.ts`.

If you cannot say that without reading, start again at Step 4, then Step 7. Those two files are the whole eval.

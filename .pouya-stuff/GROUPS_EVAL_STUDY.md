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

Stay in this file until Step 4 is finished. Read the file from line 1 down. Do not jump to the `return`.

These are the comments as they are in the file. Not a shorter version. Not a different wording.

### 4.1 Imports

```ts
// react tools
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
// function for translations
import { useTranslation } from "react-i18next";
// api calls (talk to the backend)
import { createGroup, getGroups } from "../api/groupsApi";
// the types of the data we are getting from the backend
import type { GroupItem, GroupPayload } from "../types/api";
// list of sports we are getting from the backend for the dropdown
import { useSports } from "../hooks/useSports";
// the component for the curated group card
import { CuratedGroupCard } from "../components/discover/CuratedGroupCard";
// the button component (not mine)
import Button from "../components/shared/Button";
// the default image for the group
import { DEFAULT_GROUP_IMAGE_SRC } from "../utils/media";
```

`import { a, b, c } from "somewhere"` means we take a, b, c from that file / that package.

`{ useCallback, useEffect, useState, type ChangeEvent, type FormEvent }`

- `{ }` here is not an object we create
- it means: from react, take only these names
- `type ChangeEvent` — the word `type` here means we import this only as a typescript type, not as a real function that runs
- same for `type FormEvent`

`from "react"` is the package.

`from "../api/groupsApi"` is a path. `../` means go one folder up from this file, then into `api`, then the file `groupsApi`.

`import type { GroupItem, GroupPayload }` — again the word `type`. These are not functions. They are shapes of data.

`import Button from ...` — no `{ }`. That means the other file has `export default`. We can give it the name Button here.

`import { CuratedGroupCard }` — with `{ }`. That means the other file has `export function CuratedGroupCard`. We must use the same name.

### 4.2 `type GroupFormState`

```ts
// list fields in the form and their types

type GroupFormState = {
  name: string; 
  description: string;
  sport: string;
  levels: string;
  kind: GroupPayload["kind"]; // it called Indexed Access Type
  visibility: GroupPayload["visibility"];
  joinPolicy: GroupPayload["join_policy"];
  maxMembers: string;
  locationName: string;
};
```

`type GroupFormState = { ... }` means we invent a name for this shape.

Each line is `fieldName: theType;`

- `name: string` means name is or will be a string
- `description: string` same
- `sport: string` same
- `levels: string` same — in the form it is one string, later we split it
- `kind: GroupPayload["kind"]` — it called Indexed Access Type
  - we imported `GroupPayload` at the top of the file
  - `GroupPayload["kind"]` means: go to the type GroupPayload, take the type of the field called kind
  - so we do not write the union again by hand
- `visibility: GroupPayload["visibility"]` — same, Indexed Access Type
- `joinPolicy: GroupPayload["join_policy"]` — same, Indexed Access Type
  - on the left our form field is called `joinPolicy` (camelCase)
  - on the right the backend field is called `join_policy` (snake_case)
- `maxMembers: string` — in the input it is text, so we keep string, later we convert with Number()
- `locationName: string`

### 4.3 `initialForm`

```ts
// we initialize the form with the initial values
const initialForm: GroupFormState = {
  name: "",
  description: "",
  sport: "",
  levels: "beginner",
  kind: "training",
  visibility: "public",
  joinPolicy: "open",
  maxMembers: "0",
  locationName: "",
};
```

`const initialForm: GroupFormState = { ... }`

- `const` means this variable we do not reassign later
- `: GroupFormState` means this object must have exactly those fields we listed in the type
- `= { ... }` is the starting object
- `name: ""` empty string
- `levels: "beginner"` we already put a value so the input is not empty
- `kind: "training"` must be one of the kind values from GroupPayload
- `maxMembers: "0"` it is a string `"0"` not the number 0, because the input value is always a string

### 4.4 `export function GroupsPage`

```ts
// main function for the groups page
// this function is responsible for the groups page and returns the groups page
// we define a function in typescript like function name() { return (jsx) }
// export mean this function is available to other files
// we can import it like import { GroupsPage } from "../pages/GroupsPage";

export function GroupsPage() {
```

`export function GroupsPage() { ... }`

- we define a function in typescript like `function name() { return (jsx) }`
- export mean this function is available to other files
- we can import it like `import { GroupsPage } from "../pages/GroupsPage";`
- `()` means this function takes no input
- this function is responsible for the groups page and returns the groups page

### 4.5 `useTranslation`

```ts
  /* it is shorter version of writing:
     const result = useTranslation();
     const t = result.t;

     useTranslation(); returns an object look like:
     {
       t: translationFunction(key),
       i18n: i18nObject,
       ready: boolean,
     }
     this translationFunction is responsible to return the translated text based on the key
     now instead we can call t(key) to get the translated text
     imagine we want to print the title of the groups page in h1 tag:
     <h1>
       {t("groupsTest.title")}
     </h1>
  */

  
  const { t } = useTranslation();
```

`const { t } = useTranslation();`

it is shorter version of writing:

```ts
const result = useTranslation();
const t = result.t;
```

useTranslation(); returns an object look like:

```
{
  t: translationFunction(key),
  i18n: i18nObject,
  ready: boolean,
}
```

this translationFunction is responsible to return the translated text based on the key

now instead we can call `t(key)` to get the translated text

imagine we want to print the title of the groups page in h1 tag:

```tsx
<h1>
  {t("groupsTest.title")}
</h1>
```

`{ t }` here in typescript syntax is called destructuring assignment

- we take only the field `t` from the object
- we do not make a variable for `i18n` and `ready` because we do not use them on this page

### 4.6 `useSports`

```ts
  /* 
  - useSports() is a hook that returns the list of sports
  - need to learn later what is the meaning calling a hook ? 
  - for now we say it is like calling a function that returns a value
  - sports is an array of objects returned from the useSports hook
  */
  const sports = useSports();
```

- useSports() is a hook that returns the list of sports
- need to learn later what is the meaning calling a hook ?
- for now we say it is like calling a function that returns a value
- sports is an array of objects returned from the useSports hook

`const sports = useSports();`

- `const sports` we make a variable called sports
- `=` we assign the return value
- `useSports()` the `()` belongs to the function call

### 4.7 `useState` for groups

```ts
  /* 
   - useState is a react hook that returns a tuple of two values:
     - the current state value
     - a function to update the state
     - like this we say, hey react remember for me this
  - <> is the typescript syntax for specifying a type
     - useState<string> means the state is or will be a string
  - GroupItem[]
     - we imported GroupItem at the top of the file
     - it is typescript type defined somewhere else
  - [] is the typescript syntax for specifying an array
     - GroupItem[] means an array of GroupItem objects
  - () belongs to the function call -> useState()
  - [] is the typescript syntax for specifying an array
     - useState([]) means the initial value of the state is an empty array
     - the input of useState means the starting value of the state
     - by starting value we mean the value of the state when the component is first rendered

     - so in total we say, hey react keep for me an empty array of GroupItem objects

     - useState returns a tuple of two values:
     [
       currentValue,
       functionToUpdateTheValue
     ]
     - [a, b] here in typescript syntax is called destructuring assignment
     so it is the same as writing:
     const result = useState([]);
     const a = result[0];
     const b = result[1];

     so using syntax const [a, b]  we are making two variables a and b and assigning the first and second values of the returned
     - for 3 variables we can write const [a, b, c] = exampleFunction();
     
  */
  const [groups, setGroups] = useState<GroupItem[]>([]);
```

- useState is a react hook that returns a tuple of two values:
  - the current state value
  - a function to update the state
  - like this we say, hey react remember for me this
- `<>` is the typescript syntax for specifying a type
  - `useState<string>` means the state is or will be a string
- `GroupItem[]`
  - we imported GroupItem at the top of the file
  - it is typescript type defined somewhere else
- `[]` is the typescript syntax for specifying an array
  - `GroupItem[]` means an array of GroupItem objects
- `()` belongs to the function call -> `useState()`
- `[]` is the typescript syntax for specifying an array
  - `useState([])` means the initial value of the state is an empty array
  - the input of useState means the starting value of the state
  - by starting value we mean the value of the state when the component is first rendered

  - so in total we say, hey react keep for me an empty array of GroupItem objects

  - useState returns a tuple of two values:

```
[
  currentValue,
  functionToUpdateTheValue
]
```

- `[a, b]` here in typescript syntax is called destructuring assignment
- so it is the same as writing:

```ts
const result = useState([]);
const a = result[0];
const b = result[1];
```

so using syntax `const [a, b]` we are making two variables a and b and assigning the first and second values of the returned

- for 3 variables we can write `const [a, b, c] = exampleFunction();`

on this line:

```ts
const [groups, setGroups] = useState<GroupItem[]>([]);
```

- `groups` is the current value (the array)
- `setGroups` is the function to update the state
- when we call `setGroups(newArray)` react remembers the new array and draws the page again

### 4.8 `useState` for form

```ts
  /* 
  
    - at left we do the same thing:
    - we say hey react keep a variable of type GroupFormState and assign it the initial value of initialForm
    - the initialForm defined at the top of the file
  */
  const [form, setForm] = useState<GroupFormState>(initialForm);
```

- at left we do the same thing:
- we say hey react keep a variable of type GroupFormState and assign it the initial value of initialForm
- the initialForm defined at the top of the file

`const [form, setForm] = useState<GroupFormState>(initialForm);`

- `form` is the current object with name, description, sport, ...
- `setForm` is the function to update it
- `useState<GroupFormState>` means the state is or will be a GroupFormState
- `(initialForm)` the input of useState means the starting value of the state

### 4.9 `useState` for showForm

```ts
  /*
    - hey react keep a variable of type boolean and assign it the value false

  */
  const [showForm, setShowForm] = useState(false);
```

- hey react keep a variable of type boolean and assign it the value false

`const [showForm, setShowForm] = useState(false);`

- `showForm` is the current value, starts as false
- `setShowForm` is the function to update it
- we did not write `useState<boolean>` because typescript can see `false` and understand it is boolean
- `false` means the create form is hidden when the page first renders
- later we call `setShowForm(true)` or we flip it

### 4.10 loading and submitting — same thing, no extra comment in the file

```ts
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
```

- at left we do the same thing as showForm
- we say hey react keep a variable of type boolean

first line:

- `loading` starts as `true`
- by starting value we mean the value of the state when the component is first rendered
- so when the page first renders we are still waiting for the list from the backend
- `setLoading` is the function to update it
- later we call `setLoading(false)` when we finished

second line:

- `submitting` starts as `false`
- we are not sending the create form yet
- later when the user clicks create we call `setSubmitting(true)`

### 4.11 cover image file

```ts
  /*
    - hey react keep a variable of type File | null and assign it the value null
    - File | null means the variable can be a File object or null
    - File is a typescript type for a file
    - in typescript null is different from NULL in c.
    - in typescript null is a value like NULL in c. but also it has its own type which is null
    - so if we need a variable of type string that can hold null we should initialize it like:
      const a: string | null = 'hello';
    - in typescript instead of using if (a === null) for catching an error
    we normally use a try catch block because normally when a function fails it throws an error.
  */
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
```

- hey react keep a variable of type File | null and assign it the value null
- File | null means the variable can be a File object or null
- File is a typescript type for a file
- in typescript null is different from NULL in c.
- in typescript null is a value like NULL in c. but also it has its own type which is null
- so if we need a variable of type string that can hold null we should initialize it like:
  `const a: string | null = 'hello';`
- in typescript instead of using `if (a === null)` for catching an error
  we normally use a try catch block because normally when a function fails it throws an error.

`const [coverImageFile, setCoverImageFile] = useState<File | null>(null);`

- `<>` is the typescript syntax for specifying a type
- `useState<File | null>` means the state is or will be a File or null
- `|` in typescript means or
- `(null)` the input of useState means the starting value
- so in total we say, hey react keep null until the user picks a picture
- `setCoverImageFile` is the function to update it

### 4.12 error

```ts
  const [error, setError] = useState<string | null>(null);
```

- at left we do the same thing:
- we say hey react keep a variable of type string | null and assign it the value null
- string | null means the variable can be a string or null
- `|` in typescript means or
- starting value is null — there is no error yet
- later if getGroups or createGroup fails we call `setError("some text")`
- `setError` is the function to update it

From here the file has almost no comments. We keep writing in the same way.

### 4.13 `loadGroups`

```ts
  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await getGroups());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("groupsTest.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);
```

`const loadGroups = useCallback(async () => { ... }, [t]);`

- we keep a function in a variable called `loadGroups`
- So later we can call `loadGroups()` instead of `getGroups()`
- also with inputs we can call `loadGroups("some input")` instead of `getGroups("some input")`
- it is shorter version of writing a normal function, but we wrap it in useCallback

- useCallback is a react hook
- the diffrence between useCallback and useState is that useState remembers a value, but useCallback remembers a function.

- need to learn later what is the meaning calling a hook ?
- for now we say it is like calling a function that remembers another function
- like this we say, hey react remember this function for me
- so we do not make a brand new function every time the page redraws
- means re-render the page
- useCallback takes two inputs:
  - first input: the function we want to remember → `async () => { ... }`
  - second input: `[t]`
  - `[]` is the typescript syntax for specifying an array
  - this array they call it the dependency array
  - it means: if `t` changed, then make the function again
  - we put `t` there because we use `t` inside the function

- `async () => { }` is an arrow function
- it is shorter version of writing:

```ts
async function loadGroups() {
  ...
}
```

- `()` means the function takes no input
- `=>` belongs to the arrow function
- `{ }` is the body
- `async` means inside we can use `await`
- `await` means wait until this line finishes before going to the next line
- we need await because `getGroups()` talks to the backend and that takes time

now the body, line by line:

```ts
setLoading(true);
```

- we call the update function from useState
- we say hey react, loading is now true
- the page will show the loading text

```ts
setError(null);
```

- we say hey react, error is now null
- we clear an old error so we do not keep showing it

```ts
try {
  setGroups(await getGroups());
}
```

- `try { }` means try to run this
- if it fails, go to `catch`
- `getGroups()` is the api call we imported at the top of the file
- `await getGroups()` wait until the backend answers
- the answer is an array of GroupItem objects
- `setGroups(...)` we say hey react, keep this new array
- it is shorter version of writing:

```ts
const data = await getGroups();
setGroups(data);
```

```ts
} catch (loadError) {
  setError(loadError instanceof Error ? loadError.message : t("groupsTest.loadError"));
}
```

- `catch (loadError)` means if the try failed, the error object is in `loadError`
- we normally use a try catch block because normally when a function fails it throws an error
- `loadError instanceof Error` means: is this error a real Error object?
  - `instanceof` is typescript / javascript syntax to check the type of an object
- `? :` is called ternary
- it is shorter version of writing:

```ts
if (loadError instanceof Error) {
  setError(loadError.message);
} else {
  setError(t("groupsTest.loadError"));
}
```

- `loadError.message` is the text inside the Error
- `t("groupsTest.loadError")` if it is not an Error object, we show the translated fallback text

```ts
} finally {
  setLoading(false);
}
```

- `finally` always runs
- it runs if try worked
- it runs if catch ran
- we say hey react, loading is now false
- we stop showing “Loading…”

`, [t]` we already said: dependency array of useCallback

### 4.14 `useEffect`

```ts
  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);
```

- useEffect is a react hook
- need to learn later what is the meaning calling a hook ?
- for now we say it is like calling a function that runs after react drew the screen
- like this we say, hey react after you show the page, run this

- useEffect takes two inputs:
  - first input: `() => { void loadGroups(); }`
    - `()` means the function takes no input
    - `=>` belongs to the arrow function
    - `{ }` is the body
  - second input: `[loadGroups]`
    - `[]` is the typescript syntax for specifying an array
    - this is the dependency array
    - it means: run this when `loadGroups` changed
    - first time the page opens it also runs
    - that is why the list appears by itself
    - we do not click a Load button

```ts
void loadGroups();
```

- `loadGroups()` is the function call
- `loadGroups()` returns a Promise because it is async
- `void` means: I know it returns a Promise, run it anyway, I am not using the return value
- it is shorter version of writing in our head:

```
when this page appears:
  call loadGroups()
```

### 4.15 `updateForm`

```ts
  function updateForm(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }
```

```ts
function updateForm(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
```

- we define a function in typescript like `function name() { }`
- we did not write `export` because we only use it inside this file
- `event` is the input
- `: ChangeEvent<...>` is the typescript type of the input
- we imported `type ChangeEvent` at the top of the file
- `<>` is the typescript syntax for specifying a type
- `ChangeEvent<HTMLInputElement>` means a change event that came from an `<input>`
- `|` in typescript means or
- `HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement` means the event can come from
  - an `<input>`
  - or a `<select>`
  - or a `<textarea>`
- so one function for all those fields

```ts
const { name, value } = event.target;
```

- `event.target` is the html element that changed
- that element has `.name` and `.value`
- `{ name, value }` here in typescript syntax is called destructuring assignment
- it is shorter version of writing:

```ts
const name = event.target.name;
const value = event.target.value;
```

- in the jsx later we write `name="sport"` on the select
- so if the user changes the sport dropdown, `name` is `"sport"` and `value` is for example `"yoga"`

```ts
setForm((current) => ({ ...current, [name]: value }));
```

- `setForm` is the function to update the form state
- we do not pass the new object directly
- we pass a function
- react will call this function and give us `current`
- `current` is the form right now

- `(current) => ({ ... })` is an arrow function
- it is shorter version of writing:

```ts
setForm(function (current) {
  return { ...current, [name]: value };
});
```

- the extra `( )` around `{ ... }` means: this `{ }` is an object we return, not the body of the function
- if we write `=> { ...current }` typescript thinks `{` starts the function body
- so we write `=> ({ ...current, [name]: value })`

- `{ ...current }` 
  - `...` is called spread
  - copy every field from `current` into a new object
  - we make a new object because we should not change the old one in place

- `[name]: value`
  - this is called computed property
  - `name` is a string variable, for example `"sport"`
  - `[name]: value` is the same as writing `sport: value` when name is `"sport"`
  - `[ ]` here is not an array
  - `[ ]` here means: use the value of the variable as the field name

- so in total we say: keep everything in the form, change only the field that was typed

- one function handles every text field
- that is why later each input has `onChange={updateForm}`

- the image field is special
- it is a File, not a string
- it has its own onChange later

### 4.16 `submitGroup`

```ts
  async function submitGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const levels = form.levels
      .split(",")
      .map((level) => level.trim())
      .filter(Boolean) as GroupPayload["levels"];
    const maxMembers = Number(form.maxMembers);

    setSubmitting(true);
    setError(null);
    try {
      await createGroup({
        name: form.name,
        description: form.description,
        sport: form.sport,
        levels,
        kind: form.kind,
        visibility: form.visibility,
        join_policy: form.joinPolicy,
        max_members: Number.isFinite(maxMembers) ? maxMembers : 0,
        location_name: form.locationName,
        coverImageFile,
      });
      setForm(initialForm);
      setCoverImageFile(null);
      setShowForm(false);
      await loadGroups();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("groupsTest.createError"));
    } finally {
      setSubmitting(false);
    }
  }
```

```ts
async function submitGroup(event: FormEvent<HTMLFormElement>) {
```

- we define a function in typescript like `function name() { }`
- `async` means inside we can use `await`
- `event` is the input
- `: FormEvent<HTMLFormElement>` is the typescript type
- we imported `type FormEvent` at the top of the file
- `<>` is the typescript syntax for specifying a type
- `FormEvent<HTMLFormElement>` means the submit event of a `<form>` tag

```ts
event.preventDefault();
```

- the browser default for a form is: reload the page
- we do not want that
- `preventDefault` means: do not do the browser default
- stay on this page, send with javascript

```ts
const levels = form.levels
  .split(",")
  .map((level) => level.trim())
  .filter(Boolean) as GroupPayload["levels"];
```

- `form.levels` is a string, for example `"beginner, intermediate"`
- `.split(",")` means cut the string on every comma
  - result: `["beginner", " intermediate"]`
- `.map((level) => level.trim())`
  - `.map` means: for each item in the array, return a new thing
  - `(level) => level.trim()` is an arrow function
  - `level` is one piece
  - `.trim()` removes spaces on the left and right
  - `" intermediate"` becomes `"intermediate"`
- `.filter(Boolean)`
  - `.filter` means: keep only the items where the function returns true
  - `Boolean` as a function: `Boolean("")` is false, `Boolean("beginner")` is true
  - so empty strings are removed
- `as GroupPayload["levels"]`
  - `as` is a type assertion
  - we tell typescript: treat this array as the levels type
  - `GroupPayload["levels"]` — it called Indexed Access Type
  - we imported GroupPayload at the top of the file
  - the backend wants an array of specific words, not a free string

```ts
const maxMembers = Number(form.maxMembers);
```

- `form.maxMembers` is a string, for example `"0"`
- `Number("0")` becomes the number `0`
- `Number` is a function that converts string to number

```ts
setSubmitting(true);
setError(null);
```

- hey react, submitting is now true
- hey react, error is now null
- we clear an old error

```ts
try {
  await createGroup({
    name: form.name,
    description: form.description,
    sport: form.sport,
    levels,
    kind: form.kind,
    visibility: form.visibility,
    join_policy: form.joinPolicy,
    max_members: Number.isFinite(maxMembers) ? maxMembers : 0,
    location_name: form.locationName,
    coverImageFile,
  });
```

- `try { }` means try to run this
- `createGroup` is the api call we imported at the top of the file
- `await createGroup(...)` wait until the backend saves the group
- `{ ... }` is one object we send
- look at the names:
  - the left is what the backend type GroupPayload expects
  - the right is our form state
- `name: form.name` left = backend field, right = our form field
- `levels` is shorter version of writing `levels: levels`
  - when the field name and the variable name are the same we can write only once
- `join_policy: form.joinPolicy`
  - left is snake_case for the backend
  - right is camelCase from our form
- `max_members: Number.isFinite(maxMembers) ? maxMembers : 0`
  - `Number.isFinite(maxMembers)` means: is this a real finite number? not NaN, not Infinity
  - `? :` is ternary
  - it is shorter version of writing:

```ts
if (Number.isFinite(maxMembers)) {
  max_members = maxMembers;
} else {
  max_members = 0;
}
```

  - if the user typed garbage, send `0` instead of NaN
- `location_name: form.locationName` again snake_case on the left, camelCase on the right
- `coverImageFile` is shorter version of writing `coverImageFile: coverImageFile`

```ts
setForm(initialForm);
setCoverImageFile(null);
setShowForm(false);
await loadGroups();
```

- this runs only if createGroup did not throw
- `setForm(initialForm)` hey react, put the form back to the initial values
- `setCoverImageFile(null)` hey react, no file anymore
- `setShowForm(false)` hey react, hide the form
- `await loadGroups()` wait, fetch the list again so the new group appears

```ts
} catch (submitError) {
  setError(submitError instanceof Error ? submitError.message : t("groupsTest.createError"));
} finally {
  setSubmitting(false);
}
```

- same try catch finally idea as loadGroups
- `catch (submitError)` if createGroup failed, the error is in submitError
- ternary: if it is an Error object, use `.message`, else use the translated `groupsTest.createError`
- `finally` always runs
- `setSubmitting(false)` hey react, we are not submitting anymore

### 4.17 `return` — what the screen draws

now the function returns jsx

we define a function in typescript like `function name() { return (jsx) }`

skip `className="..."`. it is only styling (size, color, spacing). they do not change the logic.

```tsx
  return (
    <main ...>
      <header ...>
        <div ...>
          <h1 ...>
            {t("groupsTest.title")}
          </h1>
          <p ...>
            {t("groupsTest.description")}
          </p>
        </div>
```

- `<main>` is the main html tag of the page
- `<header>` is the top row
- `<h1>` is the title
- `{t("groupsTest.title")}`
  - `{ }` in jsx means: this is javascript, not text
  - `t` is the translationFunction
  - this translationFunction is responsible to return the translated text based on the key
  - imagine we want to print the title of the groups page in h1 tag — this is that
- `{t("groupsTest.description")}` same, the subtitle

```tsx
        <Button
          type="button"
          variant="primary"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? t("groupsTest.cancel") : t("groupsTest.create")}
        </Button>
```

- `Button` is the component we imported at the top of the file
- the button component (not mine)
- `type="button"` so this button does not submit a form
- `onClick={...}` means: when the user clicks, run this function

```ts
() => setShowForm((visible) => !visible)
```

- this is an arrow function
- it is shorter version of writing:

```ts
function () {
  setShowForm(function (visible) {
    return !visible;
  });
}
```

- `setShowForm` is the function to update showForm
- we pass a function, react gives us `visible` = the current boolean
- `!visible` means not
- `!false` is `true`
- `!true` is `false`
- so we flip it

```tsx
{showForm ? t("groupsTest.cancel") : t("groupsTest.create")}
```

- `{ }` in jsx means javascript
- `? :` is ternary
- it is shorter version of writing:

```
if (showForm) show the cancel text
else show the create text
```

### 4.18 the create form

```tsx
      {showForm && (
        <form
          onSubmit={submitGroup}
          ...
        >
```

- `{showForm && ( <form> )}`
- `&&` means and
- in jsx: if the left side is true, draw the right side
- if the left side is false, draw nothing
- so the form exists on the page only when showForm is true
- same page, no new url

- `onSubmit={submitGroup}` means: when the form is submitted, call submitGroup
- we wrote the function submitGroup above

```tsx
          <label ...>
            {t("groupsTest.name")}
            <input name="name" value={form.name} onChange={updateForm} required />
          </label>
```

- `<label>` is the html label
- `{t("groupsTest.name")}` translated text for the field name
- `<input ... />` is the text box

- `name="name"` must match a key in form
  - because updateForm uses `event.target.name`
  - so this writes into `form.name`

- `value={form.name}`
  - `{ }` in jsx means javascript
  - `form.name` is the current state
  - they call this a controlled input
  - react state is the source of truth
  - what you see in the box is `form.name`

- `onChange={updateForm}` when the user types, call updateForm
- `required` the browser will not submit if this is empty

the description field is the same idea:

```tsx
            <textarea name="description" value={form.description} onChange={updateForm} />
```

- `<textarea>` is a bigger text box
- `name="description"` writes into `form.description`
- `value={form.description}` controlled
- `onChange={updateForm}` same function

### 4.19 the file input

```tsx
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverImageFile(event.target.files?.[0] || null)}
            />
```

- `type="file"` means the user picks a file, not text
- `accept="image/*"` means the picker should show images
- this onChange is not updateForm
- because a file is not a string

```ts
(event: ChangeEvent<HTMLInputElement>) => setCoverImageFile(event.target.files?.[0] || null)
```

- this is an arrow function we write inline
- it is shorter version of writing:

```ts
function (event: ChangeEvent<HTMLInputElement>) {
  setCoverImageFile(event.target.files?.[0] || null);
}
```

- `event: ChangeEvent<HTMLInputElement>` we imported type ChangeEvent
- `event.target.files` is a FileList, or it might be missing
- `?.` is called optional chaining
- `files?.[0]` means:
  - if files is null or undefined, do not crash, the whole expression is undefined
  - else take index 0
- `[0]` means the first file
- arrays start at 0
- `|| null`
  - `||` means or
  - if the left side is undefined / empty, use null
- `setCoverImageFile(...)` hey react, keep this File or null
- File | null we already explained above

### 4.20 the sport dropdown

```tsx
            <select name="sport" value={form.sport} onChange={updateForm} required>
              <option value="" disabled>{t("groupsTest.selectSport")}</option>
              {sports.map((sportOption) => (
                <option key={sportOption.code} value={sportOption.code}>
                  {t(`sports.${sportOption.code}`)}
                </option>
              ))}
            </select>
```

- `<select>` is a dropdown
- `name="sport"` writes into `form.sport`
- `value={form.sport}` controlled
- `onChange={updateForm}` same function
- `required` must pick a sport

- first `<option value="" disabled>` is the placeholder
- `disabled` means the user cannot pick this empty option after they opened the list
- `{t("groupsTest.selectSport")}` translated “select a sport”

```tsx
{sports.map((sportOption) => (
  <option key={sportOption.code} value={sportOption.code}>
    {t(`sports.${sportOption.code}`)}
  </option>
))}
```

- `sports` is the array of objects returned from the useSports hook
- `.map` means: for each item in the array, return a new thing
- `(sportOption) => ( <option> )` is an arrow function
- `sportOption` is one sport object
- we return one `<option>` per sport

- `key={sportOption.code}`
  - react requirement for lists
  - not visible on the screen
  - helps react know which option is which

- `value={sportOption.code}` the value we store in form.sport, for example `"yoga"`

- `{t(\`sports.${sportOption.code}\`)}`
  - this is a template string
  - `` `sports.${sportOption.code}` ``
  - `${ }` inside a template string means: put the variable here
  - if code is `"yoga"`, the key is `"sports.yoga"`
  - t returns the translated sport name

### 4.21 the other form fields

levels:

```tsx
            <input name="levels" value={form.levels} onChange={updateForm} required />
```

- same as name input
- `name="levels"` writes into `form.levels`
- it is a string, later submitGroup splits it on commas

kind:

```tsx
            <select name="kind" value={form.kind} onChange={updateForm}>
              <option value="training">{t("groupsTest.kindTraining")}</option>
              <option value="social">{t("groupsTest.kindSocial")}</option>
              <option value="competitive">{t("groupsTest.kindCompetitive")}</option>
              <option value="team">{t("groupsTest.kindTeam")}</option>
            </select>
```

- `name="kind"` writes into `form.kind`
- `value={form.kind}` controlled
- each `<option value="training">` — the value must match GroupPayload["kind"]
- `{t("groupsTest.kindTraining")}` is only the text the user sees

visibility:

```tsx
            <select name="visibility" value={form.visibility} onChange={updateForm}>
              <option value="public">{t("groupsTest.public")}</option>
              <option value="private">{t("groupsTest.private")}</option>
            </select>
```

- same idea
- `name="visibility"` writes into `form.visibility`

join policy:

```tsx
            <select name="joinPolicy" value={form.joinPolicy} onChange={updateForm}>
              <option value="open">{t("groupsTest.open")}</option>
              <option value="approval">{t("groupsTest.approval")}</option>
              <option value="invite_only">{t("groupsTest.inviteOnly")}</option>
            </select>
```

- `name="joinPolicy"` writes into `form.joinPolicy`
- look: the html name is camelCase `joinPolicy`
- that is why in submitGroup we send `join_policy: form.joinPolicy`

max members:

```tsx
            <input name="maxMembers" type="number" min="0" value={form.maxMembers} onChange={updateForm} />
```

- `type="number"` the browser shows a number input
- `min="0"` cannot go below 0
- `name="maxMembers"` writes into `form.maxMembers`
- remember: even with type="number", `event.target.value` is still a string
- that is why in the type GroupFormState we wrote `maxMembers: string`
- later `Number(form.maxMembers)`

location:

```tsx
            <input name="locationName" value={form.locationName} onChange={updateForm} />
```

- same as name input
- `name="locationName"` writes into `form.locationName`

submit button:

```tsx
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !form.sport || sports.length === 0}
            >
              {submitting ? t("groupsTest.creating") : t("groupsTest.submit")}
            </Button>
```

- `type="submit"` this button submits the form
- that will call `onSubmit={submitGroup}`

- `disabled={submitting || !form.sport || sports.length === 0}`
  - `disabled` means the button cannot be clicked
  - `||` means or
  - disabled if:
    - `submitting` is true
    - or `!form.sport`
    - or `sports.length === 0`
  - `!form.sport`
    - `!` means not
    - empty string `""` is falsy
    - so `!""` is true
    - if the user did not pick a sport, disabled
  - `sports.length === 0`
    - `.length` is how many items in the array
    - `===` is strict equals
    - if the sports list is still empty, disabled

```tsx
{submitting ? t("groupsTest.creating") : t("groupsTest.submit")}
```

- ternary
- if submitting is true, show creating text
- else show submit text

### 4.22 error, loading, empty, cards

```tsx
      {error && <p role="alert">{error}</p>}
```

- `{error && <p>}`
- `&&` in jsx: if error is not null, draw the `<p>`
- if error is null, draw nothing
- `{error}` inside the p is the string
- `role="alert"` is for screen readers, not styling

```tsx
      {loading ? (
        <p ...>{t("groupsTest.loading")}</p>
      ) : groups.length === 0 ? (
        <p ...>
          {t("groupsTest.empty")}
        </p>
      ) : (
        <div ...>
          ... cards ...
        </div>
      )}
```

- this is a nested ternary
- `? :` inside another `? :`
- it is shorter version of writing:

```
if (loading) {
  show loading text
} else if (groups.length === 0) {
  show empty text
} else {
  show cards
}
```

- `groups` is the array from useState
- `groups.length` is how many items
- `=== 0` means empty

### 4.23 the featured card (first group)

this is inside the else, when we have at least one group:

```tsx
          <CuratedGroupCard
            variant="featured"
            className="min-h-[380px] md:min-h-[420px]"
            image={groups[0].cover_image || DEFAULT_GROUP_IMAGE_SRC}
            title={groups[0].name}
            description={groups[0].description}
            categoryLabel={t(`sports.${groups[0].sport}`)}
            levelLabel={
              groups[0].levels[0]
                ? t(`discover.${groups[0].levels[0]}`)
                : undefined
            }
            memberCount={groups[0].member_count}
            timeLabel={groups[0].location_name || undefined}
            detailsTo={`/groups/${groups[0].id}`}
          />
```

- `CuratedGroupCard` is the component we imported at the top of the file
- the component for the curated group card
- we pass props
- props = the inputs of a component
- like function arguments, but we write them as attributes: `title={...}`

- skip `className` it is only styling
- `variant="featured"` means the big card look

- `groups[0]`
  - `groups` is the array
  - `[0]` means the first item
  - arrays start at 0

- `image={groups[0].cover_image || DEFAULT_GROUP_IMAGE_SRC}`
  - `groups[0].cover_image` is the picture url from the backend, or null
  - `||` means or
  - if cover_image is null / empty, use DEFAULT_GROUP_IMAGE_SRC
  - we imported DEFAULT_GROUP_IMAGE_SRC at the top of the file
  - the default image for the group

- `title={groups[0].name}` the name of the first group
- `description={groups[0].description}` the description of the first group

- `categoryLabel={t(\`sports.${groups[0].sport}\`)}`
  - template string again
  - if sport is `"yoga"`, the key is `"sports.yoga"`

```tsx
levelLabel={
  groups[0].levels[0]
    ? t(`discover.${groups[0].levels[0]}`)
    : undefined
}
```

- `groups[0].levels` is an array, for example `["beginner", "intermediate"]`
- `groups[0].levels[0]` is the first level
- if that exists (truthy), translate `discover.beginner`
- else `undefined`
- `undefined` means we do not pass a level label
- ternary again

- `memberCount={groups[0].member_count}` how many people
- look: backend field is `member_count` with underscore

- `timeLabel={groups[0].location_name || undefined}`
  - if location_name is empty, pass undefined
  - so the card can hide that line

- `detailsTo={\`/groups/${groups[0].id}\`}`
  - template string
  - `${groups[0].id}` puts the id in the url
  - if id is `abc-123`, the string is `/groups/abc-123`
  - that is the details page from step 2

### 4.24 the compact cards (the rest)

```tsx
          {groups.length > 1 ? (
            <div ...>
              {groups.slice(1).map((group) => (
                <CuratedGroupCard
                  key={group.id}
                  variant="compact"
                  className="min-h-[260px] sm:min-h-[280px]"
                  image={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}
                  title={group.name}
                  categoryLabel={t(`sports.${group.sport}`)}
                  memberCount={group.member_count}
                  timeLabel={group.location_name || undefined}
                  detailsTo={`/groups/${group.id}`}
                />
              ))}
            </div>
          ) : null}
```

```tsx
{groups.length > 1 ? (
  <div> ... </div>
) : null}
```

- ternary
- if there is more than one group, draw the grid
- else `null`
- `null` in jsx = draw nothing
- if there is only one group, we already showed it as featured, we do not draw the small grid

```tsx
{groups.slice(1).map((group) => (
  <CuratedGroupCard ... />
))}
```

- `groups.slice(1)`
  - `.slice(1)` means: new array starting at index 1
  - skip the first
  - “the rest”
- `.map((group) => ( <CuratedGroupCard /> ))`
  - for each remaining group, return one card
  - `group` is one GroupItem
- `key={group.id}` react requirement for lists
- `variant="compact"` the small card look
- skip className
- the other props are the same idea as featured, but we use `group` not `groups[0]`
- we do not pass `description` here
- `detailsTo={\`/groups/${group.id}\`}` same url idea for each card

then we close `</main>` and we close the function with `}`

You are done with `GroupsPage.tsx`.

---

## Step 5 — The card you created

**Open:** `frontend/src/components/discover/CuratedGroupCard.tsx`

This file does not call getGroups. The page already has the data. This file only draws one card.

Skip `className`. It is only styling.

### 5.1 Imports

```ts
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { KeyboardEvent } from "react";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";
import {
  DEFAULT_GROUP_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";
```

- `Users` is an icon from lucide-react (not mine)
- `useNavigate` is a hook from react-router-dom
  - need to learn later what is the meaning calling a hook ?
  - for now we say it is like calling a function that returns a value
  - the value here is a function `navigate`
  - `navigate("/groups/abc")` changes the url
- `useTranslation` we already know from GroupsPage
  - it is shorter version of writing:
    `const result = useTranslation(); const t = result.t;`
- `import type { KeyboardEvent }` — the word `type` here means we import this only as a typescript type, not as a real function that runs
- `Button` the button component (not mine)
- `Badge` a small label component (not mine)
- `DEFAULT_GROUP_IMAGE_SRC` the default image for the group
- `resolveMediaUrl` a function that turns a backend path into a url the browser can load

### 5.2 `formatCardDate`

```ts
/** Format backend ISO date as `20 Jul 2026`. */
export function formatCardDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
```

- `export` mean this function is available to other files
- we define a function in typescript like `function name() { return ... }`
- `iso?: string | null`
  - `?` after the name means the input is optional
  - we can call `formatCardDate()` with nothing
  - `string | null` means the variable can be a string or null
  - `|` in typescript means or
- `if (!iso) return "";`
  - `!iso` means: iso is missing, or empty, or null
  - `return ""` stop the function, give back empty string
- `const date = new Date(iso);` make a Date object from the string
- `Number.isNaN(date.getTime())` means the string was not a real date
  - then also return `""`
- `date.getDate()` the day number, for example 20
- `date.toLocaleString("en-GB", { month: "short" })` the month short name, for example Jul
- `date.getFullYear()` the year, for example 2026
- `` return `${day} ${month} ${year}`; ``
  - template string
  - `${ }` means put the variable here
  - result like `20 Jul 2026`

GroupsPage does not pass `dateAt`, so on the groups list this function gets undefined and returns `""`.

### 5.3 the type of the props

```ts
type CuratedGroupCardProps = {
  variant?: "featured" | "compact";
  image: string;
  title: string;
  description?: string;
  categoryLabel: string;
  levelLabel?: string;
  memberCount?: number;
  timeLabel?: string;
  dateAt?: string | null;
  detailsTo?: string;
  className?: string;
};
```

- `type CuratedGroupCardProps = { ... }` we invent a name for this shape
- **props** = the inputs of a component
- like function arguments, but the parent writes them as jsx attributes: `title={groups[0].name}`

- `?` after a field name means optional
  - the page may skip it
- `variant?: "featured" | "compact"`
  - if you pass variant, it can only be those two strings
  - `|` in typescript means or
- `image: string` required
- `title: string` required
- `description?: string` optional
- `dateAt?: string | null` optional, and also can be null
- `detailsTo?: string` optional url, for example `/groups/abc-123`

### 5.4 `export function CuratedGroupCard`

```ts
export function CuratedGroupCard({
  variant = "featured",
  image,
  title,
  description,
  categoryLabel,
  levelLabel,
  memberCount,
  timeLabel,
  dateAt,
  detailsTo,
  className = "",
}: CuratedGroupCardProps) {
```

- export mean this function is available to other files
- we can import it like `import { CuratedGroupCard } from "../components/discover/CuratedGroupCard";`
- this is what GroupsPage does at the top of the file

- the input is one object of type CuratedGroupCardProps
- `{ variant = "featured", image, title, ... }` here in typescript syntax is called destructuring assignment
- it is shorter version of writing:

```ts
export function CuratedGroupCard(props: CuratedGroupCardProps) {
  const variant = props.variant ?? "featured";
  const image = props.image;
  const title = props.title;
  ...
}
```

- `variant = "featured"` means: if the parent did not pass variant, use `"featured"`
- `className = ""` means: if the parent did not pass className, use empty string
- `??` is called nullish coalescing
  - use the right side only if the left is `null` or `undefined`

### 5.5 inside the function, before return

```ts
  const { t } = useTranslation();
```

it is shorter version of writing:

```ts
const result = useTranslation();
const t = result.t;
```

useTranslation(); returns an object look like:

```
{
  t: translationFunction(key),
  i18n: i18nObject,
  ready: boolean,
}
```

this translationFunction is responsible to return the translated text based on the key

now instead we can call `t(key)` to get the translated text

```ts
  const navigate = useNavigate();
```

- useNavigate() is a hook that returns a function
- need to learn later what is the meaning calling a hook ?
- for now we say it is like calling a function that returns a value
- `navigate` is that function
- `navigate("/groups/abc")` changes the url to the details page

```ts
  const imageUrl = resolveMediaUrl(image, DEFAULT_GROUP_IMAGE_SRC);
```

- `resolveMediaUrl` we imported at the top of the file
- first input: the image prop from the parent
- second input: the default image if the first one is missing / bad
- `imageUrl` is a string the browser can use in css `url('...')`

```ts
  const dateLabel = formatCardDate(dateAt);
```

- we call the function we wrote above
- if dateAt is missing, dateLabel is `""`

### 5.6 compact card — early return

```ts
  if (variant === "compact") {
    return (
      <article
        ...
        onClick={detailsTo ? () => navigate(detailsTo) : undefined}
```

- `if (variant === "compact")` 
  - `===` is strict equals
  - `"compact" === "compact"` is true
- we `return` here
- the featured jsx below never runs
- two looks, one component

```tsx
onClick={detailsTo ? () => navigate(detailsTo) : undefined}
```

- `onClick` means when the user clicks the card
- `? :` is ternary
- it is shorter version of writing:

```
if (detailsTo) {
  onClick = function () { navigate(detailsTo); }
} else {
  onClick = undefined
}
```

- `() => navigate(detailsTo)` is an arrow function
- `undefined` means no click handler
- if we have a url, the whole card is the click
- compact card has no Details button

```tsx
        onKeyDown={
          detailsTo
            ? (event: KeyboardEvent<HTMLElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(detailsTo);
                }
              }
            : undefined
        }
```

- `onKeyDown` means when the user presses a key while the card is focused
- again ternary: if no detailsTo, undefined
- `(event: KeyboardEvent<HTMLElement>) => { ... }` is an arrow function
- we imported `type KeyboardEvent`
- `event.key === "Enter" || event.key === " "`
  - `||` means or
  - Enter or Space
- `event.preventDefault()` on Space so the page does not scroll
- then `navigate(detailsTo)` same as click
- so the card works without a mouse

```tsx
        role={detailsTo ? "link" : undefined}
        tabIndex={detailsTo ? 0 : undefined}
```

- ternary again
- `role="link"` tells accessibility tools this acts like a link
- `tabIndex={0}` means we can focus it with Tab
- skip the className and the background divs, they are styling
- `style={{ backgroundImage: \`url('${imageUrl}')\` }}` puts the photo as background
  - `{ { } }` first `{ }` is jsx javascript, second `{ }` is an object
  - skip the rest of styling

```tsx
          <Badge ...>{categoryLabel}</Badge>
          <h3 ...>{title}</h3>
```

- `{categoryLabel}` and `{title}` are the props we passed from GroupsPage
- `{ }` in jsx means javascript

```tsx
          {typeof memberCount === "number" ? (
            <p ...>
              <Users size={14} aria-hidden="true" />
              <span>{t("discover.members", { count: memberCount })}</span>
            </p>
          ) : dateLabel ? (
            <p ...>{dateLabel}</p>
          ) : timeLabel ? (
            <p ...>{timeLabel}</p>
          ) : null}
```

- nested ternary
- it is shorter version of writing:

```
if (typeof memberCount === "number") {
  show members count
} else if (dateLabel) {
  show the date
} else if (timeLabel) {
  show the time / location text
} else {
  show nothing
}
```

- `typeof memberCount === "number"` means we actually passed a number, not undefined
- `t("discover.members", { count: memberCount })`
  - second argument is an object
  - the translation can put the number into the text
- `Users` is the icon
- `null` in jsx = draw nothing

then we close the article and we close the if.

### 5.7 featured card

if we did not return above, this is the big card.

```tsx
  return (
    <article ...>
      ... photo and overlay, skip className ...
        <div ...>
          <Badge>{categoryLabel}</Badge>
          {levelLabel ? <Badge>{levelLabel}</Badge> : null}
        </div>

        <h3 ...>{title}</h3>

        {description ? (
          <p ...>{description}</p>
        ) : null}

        {dateLabel ? (
          <p ...>{dateLabel}</p>
        ) : timeLabel ? (
          <p ...>{timeLabel}</p>
        ) : null}
```

- `{levelLabel ? <Badge>{levelLabel}</Badge> : null}`
  - ternary
  - if the parent passed levelLabel, draw the badge
  - else null = draw nothing
- `{description ? ( <p>{description}</p> ) : null}` same idea
- date / time ternary same as compact

```tsx
            {typeof memberCount === "number" ? (
              <>
                <Users size={18} aria-hidden="true" />
                <span>{t("discover.members", { count: memberCount })}</span>
              </>
            ) : null}
```

- `<> </>` is a fragment
- it means: a group of tags with no extra html wrapper
- only show members if memberCount is a number

```tsx
          {detailsTo ? (
            <Button variant="primary" onClick={() => navigate(detailsTo)}>
              {t("groups.details")}
            </Button>
          ) : null}
```

- ternary
- if we have detailsTo, draw the Details button
- else null
- `onClick={() => navigate(detailsTo)}` is an arrow function
- it is shorter version of writing:

```ts
function () {
  navigate(detailsTo);
}
```

- `{t("groups.details")}` this translationFunction is responsible to return the translated text based on the key

this is how GroupsPage opens GroupDetailsPage. the url is `/groups/` plus the id.

---

## Step 6 — The phone to the backend

**Open:** `frontend/src/api/groupsApi.ts`

Your pages never call fetch themselves. They call these functions. These functions call `apiRequest`, and `apiRequest` is the real HTTP.

### 6.1 Imports

```ts
import { apiRequest } from "./client";
import type { EventItem, GroupItem, GroupPayload } from "../types/api";
```

- `apiRequest` is the function that really talks to the backend (not mine, we just call it)
- `import type { ... }` — the word `type` here means we import this only as a typescript type, not as a real function that runs
- `GroupItem` = one group we got back
- `GroupPayload` = the object we send when we create
- `EventItem` = one event, for getGroupEvents

### 6.2 `appendFormValue`

```ts
function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}
```

- we define a function in typescript like `function name() { }`
- we did not write `export` because we only use it inside this file
- `form: FormData` first input is a FormData object
  - FormData is a browser type for sending files + text together
- `key: string` the field name, for example `"name"`
- `value: unknown` unknown means we do not know the type yet, it can be many things

```ts
if (value === undefined || value === null) return;
```

- `||` means or
- if there is no value, stop the function
- we do not append anything

```ts
if (Array.isArray(value)) {
  form.append(key, JSON.stringify(value));
  return;
}
```

- `Array.isArray(value)` means: is this an array?
- `levels` is an array
- FormData values are strings
- `JSON.stringify(value)` turns the array into a string like `'["beginner"]'`
- `form.append(key, ...)` adds it to the form
- `return` stop here so we do not also run the next append

```ts
form.append(key, String(value));
```

- if it is not an array, turn it into a string
- `String(0)` is `"0"`
- then append

### 6.3 `toGroupFormData`

```ts
function toGroupFormData(payload: GroupPayload) {
  const form = new FormData();
  appendFormValue(form, "name", payload.name);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "sport", payload.sport);
  appendFormValue(form, "levels", payload.levels);
  appendFormValue(form, "kind", payload.kind);
  appendFormValue(form, "visibility", payload.visibility);
  appendFormValue(form, "join_policy", payload.join_policy);
  appendFormValue(form, "max_members", payload.max_members);
  appendFormValue(form, "languages", payload.languages);
  appendFormValue(form, "location_name", payload.location_name);
  appendFormValue(form, "location_address", payload.location_address);
  if (payload.coverImageFile) form.append("cover_image", payload.coverImageFile);
  return form;
}
```

- `payload: GroupPayload` the object GroupsPage built in submitGroup
- `const form = new FormData();` make an empty FormData
- then we call appendFormValue for each field
- look at the names: `"join_policy"` `"max_members"` `"location_name"` — snake_case for the backend
- `if (payload.coverImageFile) form.append("cover_image", payload.coverImageFile);`
  - if there is a File, append it under the name `cover_image`
  - we do not JSON.stringify a File
- `return form` give the FormData back

### 6.4 `getGroups`

```ts
export function getGroups(params?: {
  sport?: string;
  level?: string;
  kind?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sport) query.set("sport", params.sport);
  if (params?.level) query.set("level", params.level);
  if (params?.kind) query.set("kind", params.kind);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<GroupItem[]>(`/api/groups/${suffix}`);
}
```

- export mean this function is available to other files
- we can import it like `import { getGroups } from "../api/groupsApi";`
- this is what GroupsPage does

- `params?: { sport?: string; level?: string; kind?: string; }`
  - `?` after params means the whole input is optional
  - GroupsPage calls `getGroups()` with no input
  - each field inside is also optional

- `const query = new URLSearchParams();` this is a browser object for `?sport=yoga&kind=training`

- `params?.sport`
  - `?.` is optional chaining
  - if params is undefined, do not crash, the expression is undefined
  - if params.sport exists, `query.set("sport", params.sport)`

- `const suffix = query.toString() ? \`?${query.toString()}\` : "";`
  - `query.toString()` is the string like `sport=yoga` or empty `""`
  - ternary
  - if there is a query string, suffix is `?sport=yoga`
  - else suffix is `""`

- `return apiRequest<GroupItem[]>(\`/api/groups/${suffix}\`);`
  - `<>` is the typescript syntax for specifying a type
  - `apiRequest<GroupItem[]>` means the json we get is an array of GroupItem objects
  - `GroupItem[]`
    - we imported GroupItem at the top of the file
    - `[]` is the typescript syntax for specifying an array
    - GroupItem[] means an array of GroupItem objects
  - template string `` `/api/groups/${suffix}` ``
  - if suffix is empty, url is `/api/groups/`
  - if suffix is `?sport=yoga`, url is `/api/groups/?sport=yoga`

### 6.5 `getGroup`

```ts
export function getGroup(id: string) {
  return apiRequest<GroupItem>(`/api/groups/${id}/`);
}
```

- export mean this function is available to other files
- `id: string` the group id from the url
- `apiRequest<GroupItem>` one GroupItem, not an array
- template string `` `/api/groups/${id}/` ``
- if id is `abc-123`, url is `/api/groups/abc-123/`
- GroupDetailsPage calls this

### 6.6 `createGroup`

```ts
export function createGroup(payload: GroupPayload) {
  return apiRequest<GroupItem>("/api/groups/", {
    method: "POST",
    body: toGroupFormData(payload),
  });
}
```

- export mean this function is available to other files
- GroupsPage calls this in submitGroup
- `payload: GroupPayload` the object we send
- `apiRequest<GroupItem>` the backend answers with the created GroupItem
- second argument is an object:
  - `method: "POST"` POST means create
  - `body: toGroupFormData(payload)` we convert to FormData because there can be a file

### 6.7 join, leave, events

```ts
export function joinGroup(id: string) {
  return apiRequest<{
    id: string;
    role: string;
    status: "active" | "pending";
    joined_at: string;
  }>(`/api/groups/${id}/join/`, { method: "POST" });
}
```

- export mean this function is available to other files
- GroupDetailsPage calls this when you click Apply
- `id: string` the group id
- `apiRequest<{ ... }>` 
  - `<>` is the typescript syntax for specifying a type
  - here we write the type inline, we did not invent a name
  - `status: "active" | "pending"` `|` means or
- template string `` `/api/groups/${id}/join/` ``
- `{ method: "POST" }` POST means do the join action

```ts
export function leaveGroup(id: string) {
  return apiRequest<void>(`/api/groups/${id}/leave/`, { method: "POST" });
}
```

- GroupDetailsPage calls this when you confirm Leave
- `apiRequest<void>` void means we do not care about the json body
- url is `/api/groups/${id}/leave/`
- POST again

```ts
export function getGroupEvents(id: string) {
  return apiRequest<EventItem[]>(`/api/groups/${id}/events/`);
}
```

- GroupDetailsPage calls this for the upcoming events list
- `EventItem[]` means an array of EventItem objects
- we imported EventItem at the top of the file

The real save in the database is Alex’s Django. Your job: call these, then setState.

---

## Step 7 — Group details, from the top

**Open:** `frontend/src/pages/GroupDetailsPage.tsx`

Long file. Go from the top. When you see `GroupChat`, skip it. That is Alex.

Skip `className`. It is only styling.

### 7.1 Imports

```ts
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { getGroup, getGroupEvents, joinGroup, leaveGroup } from "../api/groupsApi";
import { joinEvent, leaveEvent } from "../api/eventsApi";
import type { EventItem, GroupItem } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { ClubHero } from "../components/club/ClubHero";
import { ClubStatsRow } from "../components/club/ClubStatsRow";
import { ClubUpcomingRides } from "../components/club/ClubUpcomingRides";
import type { ClubRideItem } from "../components/club/ClubRideRow";
import Button from "../components/shared/Button";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { DEFAULT_GROUP_IMAGE_SRC } from "../utils/media";
import { GroupChat } from "../components/chat/GroupChat";
import { GroupMembersList } from "../components/groups/GroupMembersList";
```

- react tools: `useEffect`, `useRef`, `useState`
- `useNavigate`, `useParams` from react-router-dom
  - `useParams` reads the url
  - for `/groups/abc-123` it gives `{ groupId: "abc-123" }`
  - `useNavigate` returns a function to change the url (Back, Login, event details)
- function for translations: `useTranslation`
- `ArrowLeft` is an icon (not mine)
- api calls (talk to the backend): `getGroup`, `getGroupEvents`, `joinGroup`, `leaveGroup`
- `joinEvent`, `leaveEvent` talk to the events api (for upcoming events join / leave)
- the types of the data we are getting from the backend: `EventItem`, `GroupItem`
- `useAuth` is a hook that returns the logged in user
  - need to learn later what is the meaning calling a hook ?
  - for now we say it is like calling a function that returns a value
  - `{ user }` user is the person, or null if not logged in
- `ClubHero`, `ClubStatsRow`, `ClubUpcomingRides` — we reused the old Club UI
  - we did not rewrite a hero
  - we pass group data into these components
  - we do not need to open those files line by line unless someone asks
- `import type { ClubRideItem }` — the word `type` here means we import this only as a typescript type
  - this is the smaller shape the upcoming list understands
- the button component (not mine)
- `ConfirmDialog` the are you sure popup (not mine)
- the default image for the group
- `GroupChat` — not yours. skip.
- `GroupMembersList` — yours. step 8.

### 7.2 `levelLabel`

```ts
function levelLabel(level: EventItem["level"], t: (key: string) => string) {
  const key = `discover.${level}` as const;
  const translated = t(key);
  return translated === key ? level : translated;
}
```

- we define a function in typescript like `function name() { return ... }`
- we did not write export because we only use it inside this file
- `level: EventItem["level"]` — it called Indexed Access Type
  - we imported EventItem at the top of the file
  - `EventItem["level"]` means: go to the type EventItem, take the type of the field called level
- `t: (key: string) => string`
  - this means t is a function
  - input is a string (the key)
  - output is a string (the translated text)
  - that is the type of our translationFunction

- `` const key = `discover.${level}` as const; ``
  - template string
  - if level is `"beginner"`, key is `"discover.beginner"`
  - `as const` tells typescript: this is this exact string, not any string

- `const translated = t(key);`
  - this translationFunction is responsible to return the translated text based on the key

- `return translated === key ? level : translated;`
  - `===` is strict equals
  - `? :` is ternary
  - it is shorter version of writing:

```ts
if (translated === key) {
  return level;
} else {
  return translated;
}
```

  - if t did not find a translation, it returns the key itself
  - then we show the raw level instead of `discover.beginner`

### 7.3 `kindLabel`

```ts
function kindLabel(
  kind: GroupItem["kind"],
  t: (key: string, options?: Record<string, string>) => string,
) {
  const map: Record<GroupItem["kind"], string> = {
    training: t("groupsTest.kindTraining"),
    social: t("groupsTest.kindSocial"),
    competitive: t("groupsTest.kindCompetitive"),
    team: t("groupsTest.kindTeam"),
  };
  return map[kind] || kind;
}
```

- `kind: GroupItem["kind"]` — it called Indexed Access Type
- `t: (key: string, options?: Record<string, string>) => string`
  - t is a function from string to string
  - second input `options?` is optional
  - `Record<string, string>` means an object whose keys are string and values are string

- `const map: Record<GroupItem["kind"], string> = { ... }`
  - `Record<K, V>` means: an object whose keys are type K and values are type V
  - keys must be training | social | competitive | team
  - values are the translated strings

- `return map[kind] || kind;`
  - `map[kind]` looks up the current kind
  - `[kind]` here is computed property / index
  - if kind is `"training"`, this is `map.training`
  - `|| kind` — if the lookup failed (empty), show the raw kind

### 7.4 `eventToRide`

```ts
function eventToRide(
  event: EventItem,
  locale: string,
  t: (key: string) => string,
): ClubRideItem {
```

- we define a function in typescript like `function name() { return ... }`
- first input `event: EventItem` one event from the backend
- second input `locale: string` for example `"en"` `"de"` `"ua"`
- third input `t` the translationFunction
- `: ClubRideItem` after the `)` is the return type
  - we promise to return that shape
  - the club list does not understand a full EventItem
  - it wants a smaller object: ClubRideItem (day, month, time, title, joined or not)

```ts
  const start = new Date(event.start_at);
```

- backend sends a date string
- `new Date(...)` makes a Date object so we can format it

```ts
  const status = event.user_status?.status;
```

- `?.` is optional chaining
- if `user_status` is null (you did not join), do not crash
- `status` becomes undefined

```ts
  const attendingFromParticipants = Array.isArray(event.participants)
    ? event.participants.filter((p) => p.status === "attending").length
    : 0;
```

- `Array.isArray(event.participants)` means: is participants an array?
- ternary
- if yes: `.filter((p) => p.status === "attending")` keep only attending people
  - `(p) => p.status === "attending"` is an arrow function
  - `.length` how many left
- if no: `0`

```ts
  const attendingCount =
    typeof event.attending_count === "number"
      ? event.attending_count
      : attendingFromParticipants;
```

- ternary
- if the backend already sent a number attending_count, use it
- else use the number we counted from participants

```ts
  return {
    id: event.id,
    eventId: event.id,
    title: event.title,
    day: start.toLocaleDateString(locale, { day: "numeric" }),
    month: start.toLocaleDateString(locale, { month: "short" }),
    timeLabel: start.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    intensityLabel: levelLabel(event.level, t),
    userStatus:
      status === "attending" || status === "waiting" ? status : null,
    attendingCount,
    maxSlots: event.max_slots,
  };
```

- `{ ... }` is the ClubRideItem object we return
- `day: start.toLocaleDateString(locale, { day: "numeric" })` formats the day number in that language
- `month: ... { month: "short" }` short month name
- `timeLabel: start.toLocaleTimeString(...)` the time
- `intensityLabel: levelLabel(event.level, t)` we call the helper above
- `userStatus: status === "attending" || status === "waiting" ? status : null`
  - `||` means or
  - ternary
  - if status is attending or waiting, keep it
  - else null
- `attendingCount` is shorter version of writing `attendingCount: attendingCount`
- `maxSlots: event.max_slots` left is camelCase for the club row, right is snake_case from the backend

that returned object is what ClubUpcomingRides knows how to draw.

### 7.5 start of `GroupDetailsPage`

```ts
export function GroupDetailsPage() {
  const { groupId } = useParams();
```

- export mean this function is available to other files
- we can import it like `import { GroupDetailsPage } from "../pages/GroupDetailsPage";`
- this function is responsible for the group details page and returns the group details page
- we define a function in typescript like `function name() { return (jsx) }`

```ts
const { groupId } = useParams();
```

- useParams() is a hook
- need to learn later what is the meaning calling a hook ?
- for now we say it is like calling a function that returns a value
- it returns an object look like `{ groupId: "abc-123" }`
- `{ groupId }` here in typescript syntax is called destructuring assignment
- it is shorter version of writing:

```ts
const result = useParams();
const groupId = result.groupId;
```

```ts
  const navigate = useNavigate();
```

- useNavigate() returns a function
- `navigate("/groups")` goes back to the list

```ts
  const { t, i18n } = useTranslation();
```

it is shorter version of writing:

```ts
const result = useTranslation();
const t = result.t;
const i18n = result.i18n;
```

useTranslation(); returns an object look like:

```
{
  t: translationFunction(key),
  i18n: i18nObject,
  ready: boolean,
}
```

- here we take two fields from the same object
- `t` this translationFunction is responsible to return the translated text based on the key
- `i18n.language` is `"en"` / `"de"` / `"ua"`
- we pass it to eventToRide for date formatting

```ts
  const { user } = useAuth();
```

- `{ user }` destructuring assignment
- it is shorter version of writing:

```ts
const result = useAuth();
const user = result.user;
```

- user is the logged in person, or null

### 7.6 useState on the details page

```ts
  const [group, setGroup] = useState<GroupItem | null>(null);
```

- useState is a react hook that returns a tuple of two values:
  - the current state value
  - a function to update the state
  - like this we say, hey react remember for me this
- `<>` is the typescript syntax for specifying a type
- `GroupItem | null` means the variable can be a GroupItem object or null
- `|` in typescript means or
- we imported GroupItem at the top of the file
- `(null)` the input of useState means the starting value of the state
- by starting value we mean the value of the state when the component is first rendered
- so in total we say, hey react keep null until we loaded the group
- `[group, setGroup]` here in typescript syntax is called destructuring assignment
- so it is the same as writing:

```ts
const result = useState(null);
const group = result[0];
const setGroup = result[1];
```

```ts
  const [rides, setRides] = useState<ClubRideItem[]>([]);
```

- at left we do the same thing:
- we say hey react keep an empty array of ClubRideItem objects
- `ClubRideItem[]` means an array of ClubRideItem objects
- `useState([])` means the initial value of the state is an empty array
- upcoming events, already converted by eventToRide

```ts
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
```

- hey react keep a variable of type boolean and assign it the value true
- we are loading when the page first renders
- two loadings because we load the group and the events separately

```ts
  const [error, setError] = useState<string | null>(null);
```

- hey react keep a variable of type string | null and assign it the value null
- string | null means the variable can be a string or null

```ts
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
```

- hey react keep a variable of type boolean and assign it the value false
- `joining` we are not applying yet
- `leaving` we are not leaving yet
- `leaveConfirmOpen` the are you sure popup is hidden

```ts
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyNeedsAuth, setApplyNeedsAuth] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
```

- applyError: hey react keep string | null, start null
- applyNeedsAuth: hey react keep a boolean, start false — show the sign in message or not
- applySuccess: hey react keep string | null, start null — the green / normal success text

```ts
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpInfo, setRsvpInfo] = useState<string | null>(null);
  const [rsvpNeedsAuth, setRsvpNeedsAuth] = useState(false);
```

- rsvp = join / leave one event, not the group
- rsvpBusyId: which event button is busy, or null
- rsvpError: error text or null
- rsvpInfo: info text or null (for example waitlist)
- rsvpNeedsAuth: boolean, show sign in for events or not

```ts
  const [membersOpen, setMembersOpen] = useState(false);
```

- hey react keep a variable of type boolean and assign it the value false
- the member list is hidden until we click the members tile

```ts
  const applyErrorTimer = useRef<number | null>(null);
```

- useRef is a react hook
- need to learn later what is the meaning calling a hook ?
- for now we say it is like calling a function that returns a box
- like this we say, hey react keep this, but changing it does not redraw the screen
- `<>` is the typescript syntax for specifying a type
- `number | null` means the variable can be a number or null
- the number here is a timer id from `window.setTimeout`
- `.current` is the value inside the box
- starting value null — no timer yet

### 7.7 first useEffect — cleanup the timer

```ts
  useEffect(() => {
    return () => {
      if (applyErrorTimer.current) window.clearTimeout(applyErrorTimer.current);
    };
  }, []);
```

- useEffect is a react hook
- for now we say it is like calling a function that runs after react drew the screen
- first input: `() => { return () => { ... } }`
- second input: `[]`
  - `[]` is the typescript syntax for specifying an array
  - empty dependency array means: run this setup once

- the `return () => { ... }` inside useEffect is a cleanup
- react calls this when you leave the page
- `if (applyErrorTimer.current)` if we have a timer id
- `window.clearTimeout(...)` cancel the timeout
- so it does not call `setApplyError` on a page that is already gone

### 7.8 `showApplyError`

```ts
  function showApplyError(message: string) {
    setApplyError(message);
    if (applyErrorTimer.current) window.clearTimeout(applyErrorTimer.current);
    applyErrorTimer.current = window.setTimeout(() => {
      setApplyError(null);
    }, 3500);
  }
```

- we define a function in typescript like `function name() { }`
- `message: string` the text we want to show
- `setApplyError(message)` hey react, keep this error string
- `if (applyErrorTimer.current) window.clearTimeout(...)` if an old timer is running, cancel it first
- `window.setTimeout(() => { setApplyError(null); }, 3500)`
  - `() => { setApplyError(null); }` is an arrow function
  - it is shorter version of writing:

```ts
function () {
  setApplyError(null);
}
```

  - `3500` means 3500 milliseconds = 3.5 seconds
  - after 3.5 seconds, hey react, error is null again
- we store the timer id in `applyErrorTimer.current`

### 7.9 load the group

```ts
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoadingGroup(true);
    setError(null);

    getGroup(groupId)
      .then((data) => {
        if (!cancelled) setGroup(data);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("groups.loadError"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGroup(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, t]);
```

- useEffect again
- dependency array `[groupId, t]`
  - run again if the id in the url changed
  - also if t changed

```ts
if (!groupId) return;
```

- `!groupId` means groupId is missing
- `return` stop the function
- if the url has no id, we do not call the api

```ts
let cancelled = false;
```

- a normal variable inside the effect
- not useState
- we use it to ignore a late answer

```ts
setLoadingGroup(true);
setError(null);
```

- hey react, we are loading
- hey react, clear old error

```ts
getGroup(groupId)
  .then((data) => {
    if (!cancelled) setGroup(data);
  })
```

- `getGroup` is the api call we imported at the top of the file
- it returns a Promise
- `.then((data) => { ... })` means: when it works, run this
- `(data) => { ... }` is an arrow function
- `data` is the GroupItem
- it is the same idea as `await`, written as a chain
- `if (!cancelled) setGroup(data)` only update state if we are still on this group
- `!cancelled` means cancelled is false

```ts
.catch((loadError) => {
  if (!cancelled) {
    setError(
      loadError instanceof Error
        ? loadError.message
        : t("groups.loadError"),
    );
  }
})
```

- `.catch` if the promise failed
- we normally use try catch, here it is the promise version of catch
- `loadError instanceof Error` means: is this a real Error object?
- `? :` is ternary
- it is shorter version of writing:

```ts
if (loadError instanceof Error) {
  setError(loadError.message);
} else {
  setError(t("groups.loadError"));
}
```

```ts
.finally(() => {
  if (!cancelled) setLoadingGroup(false);
});
```

- `.finally` always runs, success or fail
- hey react, loadingGroup is now false

```ts
return () => {
  cancelled = true;
};
```

- cleanup
- if you click another group before the request finishes, cancelled becomes true
- then the late `.then` will not call setGroup
- otherwise an old group could overwrite a new one

### 7.10 load the events

```ts
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoadingEvents(true);
    setRsvpError(null);
    setRsvpInfo(null);
    setRsvpNeedsAuth(false);
    setRsvpBusyId(null);

    getGroupEvents(groupId)
      .then((events) => {
        if (cancelled) return;
        const list = Array.isArray(events) ? events : [];
        setRides(
          list.map((event) => eventToRide(event, i18n.language, t)),
        );
      })
      .catch(() => {
        if (!cancelled) setRides([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, user?.id, i18n.language, t]);
```

- same pattern as load the group
- `if (!groupId) return;` if no id, stop
- `let cancelled = false;` same late-answer idea
- `setLoadingEvents(true)` hey react, events are loading
- then we clear rsvp messages so an old error does not stay

- `getGroupEvents(groupId)` api call we imported at the top of the file

```ts
.then((events) => {
  if (cancelled) return;
  const list = Array.isArray(events) ? events : [];
  setRides(
    list.map((event) => eventToRide(event, i18n.language, t)),
  );
})
```

- `if (cancelled) return;` if we already left, stop
- `Array.isArray(events) ? events : []` ternary
  - extra safety
  - if the api did not return an array, use `[]`
- `.map((event) => eventToRide(event, i18n.language, t))`
  - `.map` means: for each item in the array, return a new thing
  - we convert every EventItem into a ClubRideItem
  - `i18n.language` is the current language
  - `t` is the translationFunction
- `setRides(...)` hey react, keep this new array

```ts
.catch(() => {
  if (!cancelled) setRides([]);
})
```

- if the request fails, hey react, keep an empty array
- the page still works, just no events
- we did not name the error because we do not show it here

- `.finally` hey react, loadingEvents is false
- cleanup `cancelled = true` same as the group effect

- dependency array `[groupId, user?.id, i18n.language, t]`
  - `user?.id` optional chaining, if no user this is undefined
  - if you log in, load events again (your join status can change)
  - if language changes, load / convert again so dates are in the new language

### 7.11 `handleApply`

```ts
  async function handleApply() {
    if (!groupId || joining) return;
```

- `async` means inside we can use `await`
- `if (!groupId || joining) return;`
  - `||` means or
  - if no id, or we are already joining, return = stop the function
  - prevents double click

```ts
    if (!user) {
      setApplyError(null);
      setApplySuccess(null);
      setApplyNeedsAuth(true);
      return;
    }
```

- `!user` means user is null, not logged in
- hey react, clear error and success
- hey react, applyNeedsAuth is true — show the sign in message
- `return` we do not call the api

```ts
    if (
      group?.max_members &&
      group.member_count >= group.max_members
    ) {
      setApplyNeedsAuth(false);
      setApplySuccess(null);
      showApplyError(t("groups.applyFull"));
      return;
    }
```

- `group?.max_members` optional chaining, because group might still be weird
- `&&` means and
- if there is a max and member_count is already >= max
- `>=` means greater or equal
- show the full message, stop
- `t("groups.applyFull")` this translationFunction is responsible to return the translated text based on the key

```ts
    setJoining(true);
    setApplyError(null);
    setApplyNeedsAuth(false);
    setApplySuccess(null);
```

- hey react, joining is true
- clear the old messages

```ts
    try {
      const membership = await joinGroup(groupId);
      const refreshed = await getGroup(groupId);
      setGroup(refreshed);
      if (membership?.status === "pending") {
        setApplySuccess(t("groups.applyPending"));
      } else {
        setApplySuccess(t("groups.applyJoined"));
      }
```

- `try { }` means try to run this
- `await joinGroup(groupId)` wait until the backend joins us
- `membership` is the object with status active | pending
- `await getGroup(groupId)` wait, fetch the group again
- `setGroup(refreshed)` hey react, keep the new group (member_count, current_user_membership, ...)
- `membership?.status === "pending"` optional chaining + strict equals
- if pending, show pending text
- else show joined text

```ts
    } catch (err) {
      const raw =
        err instanceof Error && err.message
          ? err.message
          : t("groups.applyError");
```

- `catch (err)` if joinGroup or getGroup threw
- we normally use a try catch block because normally when a function fails it throws an error
- `err instanceof Error && err.message` means: it is an Error and the message is not empty
- ternary: use that message, else the translated applyError

```ts
      const isAuthError =
        /authenticat|credentials|unauthorized|not provided/i.test(raw);
```

- `/authenticat|credentials|unauthorized|not provided/i` is a regular expression
- `|` inside a regex means or
- `i` at the end means ignore case (Authenticat and authenticat both match)
- `.test(raw)` returns true or false
- if the error text looks like “not logged in”, we treat it as auth error

```ts
      if (isAuthError) {
        setApplyNeedsAuth(true);
        setApplyError(null);
        return;
      }
      if (/member limit|reached its member/i.test(raw)) {
        showApplyError(t("groups.applyFull"));
        return;
      }
      if (/invite only/i.test(raw)) {
        showApplyError(t("groups.applyInviteOnly"));
        return;
      }
      showApplyError(raw);
```

- if auth error: show sign in, do not show the raw english error, stop
- if the text looks like member limit: show full, stop
- if the text looks like invite only: show invite only, stop
- else show the raw message

```ts
    } finally {
      setJoining(false);
    }
```

- `finally` always runs
- hey react, joining is false
- unlock the button

### 7.12 `handleLeaveGroup`

```ts
  async function handleLeaveGroup() {
    if (!groupId || leaving) return;
    setLeaveConfirmOpen(false);
    setLeaving(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      await leaveGroup(groupId);
      const refreshed = await getGroup(groupId);
      setGroup(refreshed);
      setApplySuccess(t("groups.leaveSuccess"));
    } catch (err) {
      const raw =
        err instanceof Error && err.message
          ? err.message
          : t("groups.leaveError");
      showApplyError(raw);
    } finally {
      setLeaving(false);
    }
  }
```

- `async` we can use await
- `if (!groupId || leaving) return;` no id or already leaving → stop
- `setLeaveConfirmOpen(false)` hey react, hide the popup
- `setLeaving(true)` hey react, we are leaving
- clear old messages
- `try`
  - `await leaveGroup(groupId)` wait, tell the backend we leave
  - `await getGroup(groupId)` wait, fetch again
  - `setGroup(refreshed)` hey react, keep the new group
  - `setApplySuccess(t("groups.leaveSuccess"))` show you left
- `catch` same instanceof Error ternary as apply
- `finally` `setLeaving(false)` always unlock

the owner never reaches this from the ui. we hide Leave with `canLeaveGroup` later.

### 7.13 `handleRsvp` — join / leave one event, not the group

```ts
  async function handleRsvp(ride: ClubRideItem) {
    if (!ride.eventId || rsvpBusyId) return;
```

- `ride: ClubRideItem` one row from the upcoming list
- `if (!ride.eventId || rsvpBusyId) return;`
  - no event id, or we are already clicking another event → stop

```ts
    if (!user) {
      setRsvpError(null);
      setRsvpInfo(null);
      setRsvpNeedsAuth(true);
      return;
    }
```

- not logged in → show sign in for events, stop, do not call the api

```ts
    const isLeaving =
      ride.userStatus === "attending" || ride.userStatus === "waiting";
```

- `||` means or
- if you already joined (or waitlist), this click means leave
- else it means join

```ts
    setRsvpBusyId(ride.id);
    setRsvpError(null);
    setRsvpInfo(null);
    setRsvpNeedsAuth(false);
```

- hey react, this event id is busy
- clear old rsvp messages

```ts
    try {
      if (isLeaving) {
        await leaveEvent(ride.eventId);
        setRides((current) =>
          current.map((item) => {
            if (item.id !== ride.id) return item;
            const wasAttending = item.userStatus === "attending";
            return {
              ...item,
              userStatus: null,
              attendingCount: wasAttending
                ? Math.max(0, (item.attendingCount ?? 1) - 1)
                : item.attendingCount,
            };
          }),
        );
```

- `if (isLeaving)` we call `leaveEvent` from eventsApi
- `await leaveEvent(ride.eventId)` wait
- then we update the list in memory, we do not reload the whole group

- `setRides((current) => current.map(...))`
  - we pass a function to setRides
  - react gives us `current` = the rides array right now
  - `.map` for each item return a new thing
  - `if (item.id !== ride.id) return item;`
    - `!==` means not equal
    - if this is not the row we clicked, keep it as it is
  - if it is the row we clicked:
    - `wasAttending` boolean, were we attending (not waitlist)
    - `return { ...item, userStatus: null, attendingCount: ... }`
    - `{ ...item }` is spread, copy every field from item into a new object
    - `userStatus: null` we are not in that event anymore
    - attendingCount ternary:
      - if we were attending, subtract 1
      - `item.attendingCount ?? 1`
        - `??` is nullish coalescing
        - if attendingCount is null or undefined, use 1
      - `Math.max(0, ...)` never go below 0
      - if we were only waiting, keep attendingCount as it is

```ts
      } else {
        const result = await joinEvent(ride.eventId);
        const nextStatus =
          result.status === "attending" || result.status === "waiting"
            ? result.status
            : "attending";
        setRides((current) =>
          current.map((item) => {
            if (item.id !== ride.id) return item;
            return {
              ...item,
              userStatus: nextStatus,
              attendingCount:
                nextStatus === "attending"
                  ? (item.attendingCount ?? 0) + 1
                  : item.attendingCount,
            };
          }),
        );
        if (nextStatus === "waiting") {
          setRsvpInfo(t("club.rides.waitlistJoined"));
        }
      }
```

- else we are joining
- `await joinEvent(ride.eventId)` wait
- `nextStatus` ternary:
  - if backend said attending or waiting, use that
  - else treat as attending
- `setRides` same map idea
  - change only the row we clicked
  - spread `...item` keeps the other fields
  - `userStatus: nextStatus`
  - if nextStatus is attending, add 1 to attendingCount
  - `?? 0` if attendingCount was missing, start from 0
- if we got waitlist, show the info text

```ts
    } catch (err) {
      const raw =
        err instanceof Error && err.message
          ? err.message
          : t("club.rides.rsvpError");
      const isAuthError =
        /authenticat|credentials|unauthorized|not provided/i.test(raw);
      if (isAuthError) {
        setRsvpNeedsAuth(true);
        setRsvpError(null);
        setRsvpInfo(null);
      } else {
        setRsvpNeedsAuth(false);
        setRsvpInfo(null);
        setRsvpError(raw);
      }
    } finally {
      setRsvpBusyId(null);
    }
```

- catch: same Error ternary
- same regex for auth
- if auth: show sign in, clear error and info
- else: show the error string
- finally: hey react, rsvpBusyId is null, unlock the buttons

### 7.14 early returns

```ts
  if (error) {
    return (
      <main ...>
        <p role="alert">{error}</p>
        ...
          <Button
            ...
            onClick={() => navigate("/groups")}
          >
            {t("groups.back")}
          </Button>
        ...
      </main>
    );
  }
```

- if error is not null, we return here
- the rest of the function does not run
- `{error}` show the string
- `onClick={() => navigate("/groups")}` arrow function, go to the list
- `{t("groups.back")}` translated Back

```ts
  if (loadingGroup || !group) {
    return (
      <main ...>
        <p>{t("groups.loading")}</p>
      </main>
    );
  }
```

- `||` means or
- if we are still loading, or group is still null, show loading and return
- after this, typescript knows group is not null
- we can write `group.name` safely

### 7.15 decisions before drawing

```ts
  const ownerName =
    [group.owner.first_name, group.owner.last_name].filter(Boolean).join(" ") ||
    group.owner.username;
```

- `[group.owner.first_name, group.owner.last_name]` is an array of two strings (or empty / undefined)
- `.filter(Boolean)` drop empty names
  - `Boolean` as a function: `Boolean("")` is false
- `.join(" ")` put a space between the remaining pieces
  - `"Pouya" + " " + "Work"` → `"Pouya Work"`
- `|| group.owner.username` if both names missing, use username

```ts
  const isOwnProfile = Boolean(user && user.id === group.owner.id);
```

- `&&` means and
- user exists AND user.id equals owner.id
- `Boolean(...)` turns the result into true or false
- if I am the owner, the owner tile should go to `/profile`, not `/users/my-id`

```ts
  const alreadyMember = Boolean(group.current_user_membership);
```

- `current_user_membership` is null if I am not in the group
- `Boolean(null)` is false
- `Boolean({ ... })` is true (any object is truthy)
- pending also counts as already member so we hide Apply

```ts
  const isActiveMember = group.current_user_membership?.status === "active";
  const isGroupOwner =
    group.current_user_membership?.role === "owner";
  const canLeaveGroup = alreadyMember && !isGroupOwner;
```

- `?.` because membership can be null
- `=== "active"` strict equals
- `=== "owner"` strict equals
- `canLeaveGroup = alreadyMember && !isGroupOwner`
  - `&&` and
  - `!isGroupOwner` not owner
  - owner cannot leave from this button

```ts
  const isPending =
    group.current_user_membership?.status === "pending";
```

- true if we applied and we are waiting for approval

```ts
  const isFull =
    Boolean(group.max_members) && group.member_count >= group.max_members;
```

- `Boolean(0)` is false, so max 0 (unlimited) is never “full”
- `&&` and then compare member_count >= max_members

```ts
  const membersLabel =
    group.max_members > 0
      ? `${group.member_count}/${group.max_members}`
      : `${group.member_count}/∞`;
```

- ternary
- if max_members > 0, template string `` `${group.member_count}/${group.max_members}` `` for example `12/20`
- else `` `${group.member_count}/∞` `` for example `12/∞`

```ts
  const activeMemberships = (group.memberships ?? []).filter(
    (membership) => membership.status === "active",
  );
```

- `group.memberships ?? []`
  - `??` is nullish coalescing
  - if memberships is null or undefined, use empty array
- `.filter((membership) => membership.status === "active")`
  - keep only active people for the list
  - pending people are not in this list

### 7.16 the screen

```tsx
        <Button
          ...
          onClick={() => navigate("/groups")}
        >
          {t("groups.back")}
        </Button>
```

- Back button
- `() => navigate("/groups")` arrow function
- changes the url to the list page

```tsx
      <ClubHero
        coverImage={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}
        name={group.name}
        description={group.description || t("groups.noDescription")}
        sportLabel={t(`sports.${group.sport}`)}
        cityLabel={group.location_name || t("groups.location")}
        showApply={!alreadyMember}
        showLeave={canLeaveGroup}
        applyDisabled={isFull}
        applyLabel={isFull ? t("groups.groupFull") : undefined}
        leaveLabel={leaving ? t("groups.leaving") : t("groups.leave")}
        onLeave={
          canLeaveGroup && !leaving
            ? () => setLeaveConfirmOpen(true)
            : undefined
        }
        onApply={
          alreadyMember || joining
            ? undefined
            : isFull
              ? () => showApplyError(t("groups.applyFull"))
              : handleApply
        }
      />
```

- we pass group data into ClubHero
- `coverImage={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}`
  - `||` or
  - if no cover, default image
- `description={group.description || t("groups.noDescription")}` if no description, translated fallback
- `sportLabel={t(\`sports.${group.sport}\`)}` template string, if sport is yoga the key is sports.yoga
- `cityLabel={group.location_name || t("groups.location")}`
- `showApply={!alreadyMember}`
  - `!` flips the boolean
  - Apply only if I am not in
- `showLeave={canLeaveGroup}`
- `applyDisabled={isFull}` cannot click apply if full
- `applyLabel={isFull ? t("groups.groupFull") : undefined}` ternary, if full show Group full, else let ClubHero use its default label
- `leaveLabel={leaving ? t("groups.leaving") : t("groups.leave")}` ternary

```tsx
onLeave={
  canLeaveGroup && !leaving
    ? () => setLeaveConfirmOpen(true)
    : undefined
}
```

- ternary
- if we can leave and we are not already leaving, the click handler is an arrow function
- that function only opens the confirm dialog
- Leave click does not leave yet
- else undefined = no handler

```tsx
onApply={
  alreadyMember || joining
    ? undefined
    : isFull
      ? () => showApplyError(t("groups.applyFull"))
      : handleApply
}
```

- nested ternary
- it is shorter version of writing:

```
if (alreadyMember || joining) {
  no handler
} else if (isFull) {
  handler = show full error
} else {
  handler = handleApply
}
```

```tsx
      <ConfirmDialog
        open={leaveConfirmOpen}
        title={t("groups.leaveConfirmTitle")}
        message={t("groups.leaveConfirm", { title: group.name })}
        confirmLabel={t("groups.leave")}
        onConfirm={handleLeaveGroup}
        onCancel={() => setLeaveConfirmOpen(false)}
      />
```

- `open={leaveConfirmOpen}` show the popup only when true
- `t("groups.leaveConfirm", { title: group.name })` second argument is an object, the translation can put the group name into the text
- `onConfirm={handleLeaveGroup}` Yes runs handleLeaveGroup
- `onCancel={() => setLeaveConfirmOpen(false)}` arrow function, hey react, hide the popup

```tsx
        {(applyNeedsAuth || applyError || applySuccess || isPending) && (
          <div ...>
```

- `{ A && ( <div> ) }`
- `||` means or
- if any of these is true / not null, draw the message box
- if all are false / null, draw nothing

inside:

```tsx
            {applyNeedsAuth ? (
              <p role="alert" ...>
                {t("groups.applySignInRequired")}{" "}
                <button type="button" ... onClick={() => navigate("/login")}>
                  {t("nav.login")}
                </button>
                {" · "}
                <button type="button" ... onClick={() => navigate("/register")}>
                  {t("nav.register")}
                </button>
              </p>
            ) : null}
```

- ternary: if applyNeedsAuth, show the sign in paragraph, else null
- `{" "}` a space in jsx
- `onClick={() => navigate("/login")}` go to login
- `onClick={() => navigate("/register")}` go to register
- `type="button"` so these buttons do not submit a form

```tsx
            {applyError ? (
              <p role="alert" ...>{applyError}</p>
            ) : null}
            {applySuccess ? (
              <p ...>{applySuccess}</p>
            ) : null}
            {!applyNeedsAuth && !applyError && !applySuccess && isPending ? (
              <p ...>{t("groups.applyPending")}</p>
            ) : null}
```

- if applyError, show it
- if applySuccess, show it
- last ternary: if we are pending and we are not already showing another message, show pending text
- `&&` and, `!` not

```tsx
        <ClubStatsRow
          members={membersLabel}
          middleValue={kindLabel(group.kind, t)}
          middleLabel={t("groups.kind")}
          owner={{
            name: ownerName,
            avatarUrl: group.owner.avatar,
            to: isOwnProfile ? "/profile" : `/users/${group.owner.id}`,
          }}
          onMembersClick={() => setMembersOpen((open) => !open)}
          membersExpanded={membersOpen}
          membersListId="group-members-list"
        />
```

- three tiles: members, group type, owner
- `middleValue={kindLabel(group.kind, t)}` we call our helper
- `owner={{ ... }}` 
  - first `{ }` is jsx javascript
  - second `{ }` is an object
  - `to: isOwnProfile ? "/profile" : \`/users/${group.owner.id}\``
    - ternary
    - if I am the owner, `/profile`
    - else template string `/users/` plus the owner id

```tsx
onMembersClick={() => setMembersOpen((open) => !open)}
```

- arrow function
- `setMembersOpen((open) => !open)`
- same flip as showForm on GroupsPage
- `open` is the current boolean
- `!open` not
- `!false` is true, `!true` is false

```tsx
        {membersOpen ? (
          <GroupMembersList
            memberships={activeMemberships}
            currentUserId={user?.id}
          />
        ) : null}
```

- ternary
- if membersOpen, draw GroupMembersList
- else null
- `memberships={activeMemberships}` the filtered array we made above
- `currentUserId={user?.id}`
  - `?.` if no user, pass undefined

```tsx
        {isActiveMember && (
          <GroupChat groupId={group.id} groupName={group.name} />
        )}
```

- `{isActiveMember && ( <GroupChat /> )}`
- if I am an active member, draw the chat
- **not yours. skip.**

```tsx
            <ClubUpcomingRides
              rides={rides}
              loading={loadingEvents}
              onRsvp={isActiveMember ? handleRsvp : undefined}
              title={t("groups.upcomingEvents")}
              headerAction={
                isGroupOwner ? (
                  <Button
                    ...
                    onClick={() => navigate(`/events/new?groupId=${group.id}`)}
                  >
                    {t("groups.createEvent")}
                  </Button>
                ) : undefined
              }
              rsvpBusyId={rsvpBusyId}
              rsvpError={rsvpError}
              rsvpInfo={rsvpInfo}
              rsvpNeedsAuth={rsvpNeedsAuth}
            />
```

- `rides={rides}` the converted array
- `loading={loadingEvents}` so the list can show loading
- `onRsvp={isActiveMember ? handleRsvp : undefined}`
  - ternary
  - if I am not an active member, we pass undefined
  - Join buttons do not appear
  - I can still look
- `headerAction={ isGroupOwner ? ( <Button> ) : undefined }`
  - only the owner gets Create group event
  - `onClick={() => navigate(\`/events/new?groupId=${group.id}\`)}`
  - template string
  - `?groupId=` is a query string
  - create event page reads it
- the rsvp* props pass the event join state we kept in useState

then we close the function with `}`

You are done with `GroupDetailsPage.tsx` except chat.

---

## Step 8 — The member list you created

**Open:** `frontend/src/components/groups/GroupMembersList.tsx`

The details page already filtered to active members. This file only displays them.

Skip `className`. It is only styling.

### 8.1 Imports

```ts
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { GroupMembership } from "../../types/api";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";
```

- `Link` is react router
  - click = change url without full page reload
- function for translations: `useTranslation`
- `import type { GroupMembership }` — the word `type` here means we import this only as a typescript type, not as a real function that runs
  - it is typescript type defined somewhere else
- `DEFAULT_AVATAR_SRC` the default picture for a person
- `resolveMediaUrl` turns a backend path into a url the `<img>` can use

### 8.2 the type of the props

```ts
type GroupMembersListProps = {
  memberships: GroupMembership[];
  currentUserId?: string;
};
```

- `type GroupMembersListProps = { ... }` we invent a name for this shape
- `memberships: GroupMembership[]`
  - we imported GroupMembership at the top of the file
  - `[]` is the typescript syntax for specifying an array
  - GroupMembership[] means an array of GroupMembership objects
- `currentUserId?: string`
  - `?` means optional
  - so we can link “me” to `/profile`

### 8.3 `ROLE_ORDER`

```ts
const ROLE_ORDER: Record<GroupMembership["role"], number> = {
  owner: 0,
  admin: 1,
  member: 2,
};
```

- `const ROLE_ORDER` we keep an object in a variable
- `: Record<GroupMembership["role"], number>`
  - `Record<K, V>` means: an object whose keys are type K and values are type V
  - `GroupMembership["role"]` — it called Indexed Access Type
  - keys are owner | admin | member
  - values are number
- a lookup table
- smaller number = higher in the list
- owner 0, then admin 1, then member 2

### 8.4 `memberName`

```ts
function memberName(membership: GroupMembership) {
  return (
    [membership.user.first_name, membership.user.last_name]
      .filter(Boolean)
      .join(" ") || membership.user.username
  );
}
```

- we define a function in typescript like `function name() { return ... }`
- `membership: GroupMembership` one row
- same first+last trick as ownerName on the details page
- `[first_name, last_name]` array of two values
- `.filter(Boolean)` drop empty
- `.join(" ")` put a space between
- `|| membership.user.username` if both missing, username

### 8.5 `roleLabel`

```ts
function roleLabel(
  role: GroupMembership["role"],
  t: (key: string) => string,
) {
  if (role === "owner") return t("groups.owner");
  if (role === "admin") return t("groups.roleAdmin");
  return t("groups.roleMember");
}
```

- `role: GroupMembership["role"]` — it called Indexed Access Type
- `t: (key: string) => string` t is a function from string to string
  - this translationFunction is responsible to return the translated text based on the key
- `if (role === "owner") return t("groups.owner");` stop and return owner text
- `if (role === "admin") return t("groups.roleAdmin");` stop and return admin text
- otherwise return member text

### 8.6 `export function GroupMembersList`

```ts
export function GroupMembersList({
  memberships,
  currentUserId,
}: GroupMembersListProps) {
  const { t } = useTranslation();
```

- export mean this function is available to other files
- we can import it like `import { GroupMembersList } from "../components/groups/GroupMembersList";`
- `{ memberships, currentUserId }` here in typescript syntax is called destructuring assignment
- it is shorter version of writing:

```ts
export function GroupMembersList(props: GroupMembersListProps) {
  const memberships = props.memberships;
  const currentUserId = props.currentUserId;
```

```ts
const { t } = useTranslation();
```

it is shorter version of writing:

```ts
const result = useTranslation();
const t = result.t;
```

```ts
  const ordered = [...memberships].sort((left, right) => {
    const roleDelta = ROLE_ORDER[left.role] - ROLE_ORDER[right.role];
    if (roleDelta !== 0) return roleDelta;
    return left.joined_at.localeCompare(right.joined_at);
  });
```

- `[...memberships]`
  - `...` is called spread
  - copy every item into a **new** array
  - `.sort` would change the original array in place
  - we copy first so we do not change the array the parent gave us

- `.sort((left, right) => { ... })`
  - `.sort` takes a function with two items
  - `(left, right) => { ... }` is an arrow function
  - if the number we return is negative, left goes first
  - if positive, right goes first
  - if 0, they stay in the same order (then we compare dates)

- `ROLE_ORDER[left.role]` look up 0, 1, or 2
- `ROLE_ORDER[left.role] - ROLE_ORDER[right.role]`
  - if left is owner (0) and right is member (2), 0 - 2 = -2, left goes first

- `if (roleDelta !== 0) return roleDelta;`
  - `!==` means not equal
  - if roles are different, we are done sorting these two

- `return left.joined_at.localeCompare(right.joined_at);`
  - if roles are equal, compare join dates as strings
  - `localeCompare` returns negative / 0 / positive like sort wants
  - earlier date goes first

### 8.7 the return

```tsx
      <h2 ...>
        {t("club.stats.activeMembers")}
      </h2>
      {ordered.length === 0 ? (
        <p ...>{t("groups.membersEmpty")}</p>
      ) : (
        <ul ...>
          {ordered.map((membership) => {
```

- `{t("club.stats.activeMembers")}` translated title
- ternary
- if ordered.length === 0, show empty text
- else show `<ul>` the list
- `.map((membership) => { ... })` for each membership return one `<li>`

```tsx
            const name = memberName(membership);
            const to =
              currentUserId && membership.user.id === currentUserId
                ? "/profile"
                : `/users/${membership.user.id}`;
            return (
              <li key={membership.id}>
                <Link to={to} ...>
```

- `const name = memberName(membership);` we call our helper
- `const to = ...`
  - `&&` and
  - `? :` ternary
  - if currentUserId exists AND this row is me, `to` is `"/profile"`
  - else template string `` `/users/${membership.user.id}` ``
- `return ( <li> ... )` because we used `{ }` on the arrow function, we must write return
  - if we used `( )` we would not need return
- `key={membership.id}` react requirement for lists
- `<Link to={to}>` click changes the url to `to`

```tsx
                  <img
                    src={resolveMediaUrl(membership.user.avatar, DEFAULT_AVATAR_SRC)}
                    alt={name}
                    ...
                    onError={(event: { currentTarget: HTMLImageElement }) => {
                      event.currentTarget.src = DEFAULT_AVATAR_SRC;
                    }}
                  />
                  <div ...>
                    <p ...>{name}</p>
                    <p ...>
                      {roleLabel(membership.role, t)}
                    </p>
                  </div>
```

- `src={resolveMediaUrl(membership.user.avatar, DEFAULT_AVATAR_SRC)}`
  - first input the avatar from the backend, maybe null
  - second input the default picture
- `alt={name}` the text if the image cannot load / for screen readers
- `onError={(event) => { event.currentTarget.src = DEFAULT_AVATAR_SRC; }}`
  - arrow function
  - if the avatar url is broken, the img fires onError
  - we set `src` to the default picture
- `{name}` the display name
- `{roleLabel(membership.role, t)}` owner / admin / member translated

---

## Step 9 — What a group looks like in data

**Open:** `frontend/src/types/api.ts`

Find `GroupMembership`, `GroupItem`, `GroupPayload`. You do not read the whole file.

At the top of that file the comments are:

```ts
// This file contains TypeScript type definitions 
// for the frontend API. 
// It defines the structure of user data, 
// event participants, event items, 
// and message items used in the application.
```

### 9.1 `GroupMembership`

```ts
export type GroupMembership = {
  id: number;
  user: User;
  role: "owner" | "admin" | "member";
  status: "active" | "pending";
  joined_at: string;
};
```

- `export type` mean this type is available to other files
- we can import it like `import type { GroupMembership } from "../types/api";`
- `id: number` a number, not a string
- `user: User` another type in the same file, the person
- `role: "owner" | "admin" | "member"`
  - `|` in typescript means or
  - only these three strings
- `status: "active" | "pending"` only these two strings
- `joined_at: string` a date string from the backend

GroupMembersList uses this.

### 9.2 `GroupItem`

```ts
export type GroupItem = {
  id: string;
  name: string;
  description: string;
  sport: string;
  levels: Array<"beginner" | "intermediate" | "advanced" | "all">;
  kind: "training" | "social" | "competitive" | "team";
  visibility: "public" | "private";
  join_policy: "open" | "approval" | "invite_only";
  max_members: number;
  languages: string[];
  location_name: string;
  location_address: string;
  cover_image: string | null;
  owner: User;
  is_active: boolean;
  member_count: number;
  current_user_membership: {
    role: "owner" | "admin" | "member";
    status: "active" | "pending";
  } | null;
  memberships?: GroupMembership[];
  created_at: string;
  updated_at: string;
};
```

- this is one group we **got back** from the backend
- GroupsPage keeps `GroupItem[]` in useState
- GroupDetailsPage keeps `GroupItem | null` in useState

fields you actually use, one by one:

- `id: string` goes into the url `/groups/${id}`
- `name: string` the title on the card and on details
- `description: string` on the featured card and on ClubHero
- `sport: string` we put it into `t(\`sports.${sport}\`)`
- `levels: Array<"beginner" | "intermediate" | "advanced" | "all">`
  - `Array<...>` is another way to write an array type
  - it is the same idea as `("beginner" | "intermediate" | "advanced" | "all")[]`
  - GroupsPage uses `groups[0].levels[0]` for the featured badge
- `kind: "training" | "social" | "competitive" | "team"` GroupDetailsPage shows this in the middle tile
- `visibility` and `join_policy` we send them when we create, we also get them back
- `max_members: number` 0 means unlimited on the details page
- `languages: string[]` an array of strings, we do not really show it on these two screens
- `location_name: string` we pass it as timeLabel on the card, and cityLabel on ClubHero
- `location_address: string` we do not really show it on these two screens
- `cover_image: string | null`
  - string | null means the variable can be a string or null
  - we write `cover_image || DEFAULT_GROUP_IMAGE_SRC`
- `owner: User` the owner person, we use first_name, last_name, username, avatar, id
- `is_active: boolean` we do not really branch on this on these screens
- `member_count: number` how many people, we pass to the card and we build `12/20`
- `current_user_membership: { role, status } | null`
  - this is **me** in this group, or null
  - `| null` means I might not be in the group
  - this is how Apply vs Leave is decided
  - `.status === "active"` isActiveMember
  - `.status === "pending"` isPending
  - `.role === "owner"` isGroupOwner
- `memberships?: GroupMembership[]`
  - `?` means optional
  - the array of everybody, for the member list
  - we write `group.memberships ?? []` then filter active
- `created_at` `updated_at` date strings, we do not show them on these screens

### 9.3 `GroupPayload`

```ts
export type GroupPayload = {
  name: string;
  description?: string;
  sport: string;
  levels: Array<"beginner" | "intermediate" | "advanced" | "all">;
  kind?: "training" | "social" | "competitive" | "team";
  visibility?: "public" | "private";
  join_policy?: "open" | "approval" | "invite_only";
  max_members?: number;
  languages?: string[];
  location_name?: string;
  location_address?: string;
  coverImageFile?: File | null;
};
```

- this is the **send** shape for create
- different name from GroupItem
- fewer fields
- no `id` yet — the backend creates the id
- `?` after a field name means optional
  - we do not have to send description, kind, ...
- `coverImageFile?: File | null`
  - File | null means the variable can be a File object or null
  - File is a typescript type for a file
  - this is the file from the form on GroupsPage
- look: GroupItem has `cover_image` (url string from backend)
- GroupPayload has `coverImageFile` (the File we upload)

on GroupsPage we wrote:

```ts
kind: GroupPayload["kind"]; // it called Indexed Access Type
```

that means: go to this type, take the type of the field called kind.

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

> I implemented the Groups list and the group details page. The list keeps groups in useState, loads them with getGroups in useEffect, and can create a group with createGroup. I render groups with CuratedGroupCard. The first group is featured with a Details button. The others are compact. Details goes to /groups/:id. On details I read groupId from useParams, load getGroup and getGroupEvents, and I wrote apply, leave, and event join. I reused the club hero, stats, and upcoming-events layout. Members opens GroupMembersList. Header, footer, and group chat are not mine. The backend is Alex’s. I call it from groupsApi.ts.

If you cannot say that without reading, start again at Step 4, then Step 7. Those two files are the whole eval.

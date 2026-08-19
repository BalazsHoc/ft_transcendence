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

// main function for the groups page
// this function is responsible for the groups page and returns the groups page
// we define a function in typescript like function name() { return (jsx) }
// export mean this function is available to other files
// we can import it like import { GroupsPage } from "../pages/GroupsPage";

export function GroupsPage() {
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
  
  /* 
  - useSports() is a hook that returns the list of sports
  - need to learn later what is the meaning calling a hook ? 
  - for now we say it is like calling a function that returns a value
  - sports is an array of objects returned from the useSports hook
  */
  const sports = useSports();

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

  /* 
  
    - at left we do the same thing:
    - we say hey react keep a variable of type GroupFormState and assign it the initial value of initialForm
    - the initialForm defined at the top of the file
  */
  const [form, setForm] = useState<GroupFormState>(initialForm);

  /*
    - hey react keep a variable of type boolean and assign it the value false

  */
  const [showForm, setShowForm] = useState(false);


  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const [error, setError] = useState<string | null>(null);
  
/* 
 - we store the function in a variable called loadGroups
 - so later we can call loadGroups() instead of getGroups()

 - useCallback is also a react hook its diffrence with useState is that useState remembers a value, but useCallback remembers a function.
 - useCallback takes two inputs which are:
   1- async () => { ... } -> this is the function we want to remember
   2- [t] -> this is the input of the function we want to remember

 - async () => { ... }  is an arrow function
 - we already know about normal functions
 
  - async keyword is used to make a function asynchronous
  - async () => { ... } means a async arrow function that takes no arguments

  - Normal Function vs Arrow Function
Both are used to create functions.
// Normal function
function add(a, b) {
    return a + b;
}


// Arrow function
const add = (a, b) => {
    return a + b;
};
Both are called the same way:
add(2, 3);
Both can be passed to another function:
callFunction(add);
Arrow functions are shorter and especially convenient when creating a function directly as an argument/callback:
// Normal
callFunction(function () {
    return "hello";
});


// Arrow
callFunction(() => {
    return "hello";
});
This is why arrow functions are very common in React:
onClick={() => setShowForm(true)}
Important: They are not completely identical. Arrow functions behave differently with things like this, arguments, constructors, and hoisting. For our current React code, we don't need those differences yet.

Simple rule for now:

Arrow functions are a shorter way to write functions and are especially useful for small callback functions passed to other functions.


------------------------------------------------------------------

An async function runs normally until it reaches an await. 
If the thing it is waiting for is not ready, 
the function pauses at that line, 
but the rest of the program does not pause, 
so JavaScript continues running the lines after the function call and other work. 
When the awaited operation finishes, 
the paused function becomes ready and resumes from the line after await when JavaScript gets the chance.
 This does not create two threads; JavaScript is basically switching between work instead of blocking everything while waiting.
*/

  const loadGroups = useCallback(async () => {
    // we set the loading that we just remembered above in the hook to true
    setLoading(true);
    // we set the error to null to clear any previous errors
    setError(null);
    try {
      // we just defined this to the hook above
      // getGroups() is an api call to the backend to get the groups
      // await means wait for the api call to finish
      // because this we set this function to be asynchronous
      // since getGroups() can fail (throw an error) we use a try catch block
      setGroups(await getGroups());
    } catch (loadError) {  // we just named the error object we caught as loadError
      // loadError -> the thrown we caught
      // instanceof -> is an operator that checks if the object in the left is an instance of the object in the right
      // Error -> is a typescript type for an error

      // LoadError.message -> the message of the error we caught
      // t("groupsTest.loadError") -> the translated text for the key "groupsTest.loadError"

      // so if the error is an instance of Error we set the error message to the message of the error we caught
      // if not we set the error message to the translated text for the key "groupsTest.loadError"
      // how can it be an instance of Error and how can it be not an instance of Error?
      // it is a defensive programming technique if anyhow we catch an object which is not an instance of Error and we didn't
      // protected it, it would cause a runtime error
      // what could really happend in production is the website would crash

      setError(loadError instanceof Error ? loadError.message : t("groupsTest.loadError"));
      // we always go to try block first but if no error we never go to catch block
      // in our case in catch block we dont have return or exit so it will always continue executing the code
      // in try catch structure even if we have return finally always executes (not our case)
    } finally {
      setLoading(false);
    }
  // we call this [t] dependency, it is the same as [t] in the 2nd input of useCallback
  // using this dependency we say, hey react if t changes (translation changes) we need to re-run the function
  // so when we change from En to De it will re-run the function and remember the new one
  }, [t]);

  /*
    - useEffect is also a react hook 
    - it takes two inputs which are:
      1- () => { ... } -> this is the function we want to run
      2- [t] -> this is the input of the function we want to run

      - above we defined loadGroups
      - here we say, hey react remember for me this function and run it when the component is mounted
      - whenever loadGroups changes useEffect will re-run the function

      as the first input why we didnt wrote loadGroups() but instead we wrote () => { loadGroups() } ?
      loadGroups() means calling the function immediately and returning the result
      so useEffect will recieve the returned result of loadGroups() 
      but () => { loadGroups() } means calling the function and returning the function itself
      
      remember loadGroups was a async function so it returns a promise
      promise mean when the function is waiting for await to finish it will return a promise
      which is a object that say hey i am waiting for await to finish so you can use me later
      in this case we need to pass function itself to useEffect instead of the result of the function
      so it can wait for await to finish
  */
  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  /*
    - function updateForm() -> create a normal function called updateForm
    - it will have one input which is an event
    - event is an object that reflects changes as soon as they happen
    - like typing in a input field, clicking a button, etc.
    
    - event carries information about the change
    - user type something -> input field changes -> react creates an event object
    -imagine we have a a input field, event of it will look like this:
    {
      target: {
        name: "name",
        onchange = {updateForm} 
    }
    
    if we type football club this has happen:
    event -> ChangeEvent object -> event.target -> the <input> -> event.target.name -> "name" -> event.target.value -> "Football Club"

    - so target is what triggered the event

    - reminder -> in typescript we define types for variables like this:
      const a: string = "hello";

      so by event: we also define the type of the event object which are:
          - so target is what triggered the event
     - reminder -> in typescript we set types for variables like this:
      const a: string = "hello";
      
      so here by event: we are setting the type of the event to:
      ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>

      top of screen we import import { type ChangeEvent } from "react";
      <> give the type more information
      for changeEvent react need to know:
      - a changedEvent from what type HTML element?
        - HTMLInputElement ->  tells react the event is from an input field
        - HTMLSelectElement ->  tells react the event is from a select field
          - select field is a dropdown menu
        - HTMLTextAreaElement ->  tells react the event is from a textarea field
          - textarea field is a multi-line text input field
      - so basically we are saying updateForm should expect an event from an input field or a select field or a textarea field
  */
  function updateForm(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    // event.target looks like this:
    // {
    //   name: "name",
    //   value: "Football Club"
    // }
    // so we store the name in name and the value in value
    const { name, value } = event.target;

    // setForm is a function that updates the form state
    // current is the current state of the form

    // remember we had const [form, setForm] = useState<GroupFormState>(initialForm);
    // there by form is the current state of the form and setForm is the function that updates the form state

    // so form first get current in as input to know the current state of the form
    // ... call spread operator
    // spread operator is a way to spread the properties of an object into a new object
    // by spreading we mean we are making a new object by copying the properties of the current object
    // so ...current means take all the properties of the current object and copy them to a new object

    // so now our current look like this:
    // {
    //   name: "Football Club",
    //   description: "",
    //   sport: "",
    //   levels: "beginner",
    //   kind: "training",
    //   visibility: "public",
    //   joinPolicy: "open",
    //   maxMembers: "0",
    //   locationName: "",
    // }

    // so above we saved the name and value of event.target to name and value
    // so here by [name] : value we are finding the property of the object we created which has the same name
    // to name we stored from event.target.name and replace the value with the value we stored from event.target.value
    
    setForm((current) => ({ ...current, [name]: value }));
  }

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

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {t("groupsTest.title")}
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)] md:text-base">
            {t("groupsTest.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? t("groupsTest.cancel") : t("groupsTest.create")}
        </Button>
      </header>

      {showForm && (
        <form
          onSubmit={submitGroup}
          className="grid grid-cols-1 gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-2 md:p-6"
        >
          <label className="md:col-span-2">
            {t("groupsTest.name")}
            <input name="name" value={form.name} onChange={updateForm} required />
          </label>
          <label className="md:col-span-2">
            {t("groupsTest.descriptionLabel")}
            <textarea name="description" value={form.description} onChange={updateForm} />
          </label>
          <label>
            {t("groups.image")}
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverImageFile(event.target.files?.[0] || null)}
            />
          </label>
          <label>
            {t("groupsTest.sport")}
            <select name="sport" value={form.sport} onChange={updateForm} required>
              <option value="" disabled>{t("groupsTest.selectSport")}</option>
              {sports.map((sportOption) => (
                <option key={sportOption.code} value={sportOption.code}>
                  {t(`sports.${sportOption.code}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("groupsTest.levels")}
            <input name="levels" value={form.levels} onChange={updateForm} required />
          </label>
          <label>
            {t("groupsTest.kind")}
            <select name="kind" value={form.kind} onChange={updateForm}>
              <option value="training">{t("groupsTest.kindTraining")}</option>
              <option value="social">{t("groupsTest.kindSocial")}</option>
              <option value="competitive">{t("groupsTest.kindCompetitive")}</option>
              <option value="team">{t("groupsTest.kindTeam")}</option>
            </select>
          </label>
          <label>
            {t("groupsTest.visibility")}
            <select name="visibility" value={form.visibility} onChange={updateForm}>
              <option value="public">{t("groupsTest.public")}</option>
              <option value="private">{t("groupsTest.private")}</option>
            </select>
          </label>
          <label>
            {t("groupsTest.joinPolicy")}
            <select name="joinPolicy" value={form.joinPolicy} onChange={updateForm}>
              <option value="open">{t("groupsTest.open")}</option>
              <option value="approval">{t("groupsTest.approval")}</option>
              <option value="invite_only">{t("groupsTest.inviteOnly")}</option>
            </select>
          </label>
          <label>
            {t("groupsTest.maxMembers")}
            <input name="maxMembers" type="number" min="0" value={form.maxMembers} onChange={updateForm} />
          </label>
          <label>
            {t("groupsTest.location")}
            <input name="locationName" value={form.locationName} onChange={updateForm} />
          </label>
          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !form.sport || sports.length === 0}
            >
              {submitting ? t("groupsTest.creating") : t("groupsTest.submit")}
            </Button>
          </div>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p className="text-[var(--muted)]">{t("groupsTest.loading")}</p>
      ) : groups.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[var(--surface-border)] px-6 py-16 text-center text-[var(--muted)]">
          {t("groupsTest.empty")}
        </p>
      ) : (
        <div className="space-y-5 md:space-y-6">
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

          {groups.length > 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
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
        </div>
      )}
    </main>
  );
}

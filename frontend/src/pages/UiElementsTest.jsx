import { useState } from "react";
import { ArrowRight, Plus, Save, Star, Trash2 } from "lucide-react";
import Button from "../components/test_ui/TestButton";
import Badge from "../components/test_ui/TestBadge";

const buttonVariants = [
  {
    variant: "primary",
    title: "Primary",
    description: "Use for the main action on a page.",
  },
  {
    variant: "secondary",
    title: "Secondary",
    description: "Use for the less important action next to a primary one.",
  },
  {
    variant: "outline",
    title: "Outline",
    description: "Use when you want a lighter action without full emphasis.",
  },
  {
    variant: "glass",
    title: "Glass",
    description: "Use on image-heavy or elevated surfaces.",
  },
  {
    variant: "indigo",
    title: "Indigo",
    description: "Use as a playful accent or for special actions.",
  },
  {
    variant: "danger",
    title: "Danger",
    description: "Use for destructive actions only.",
  },
];

const buttonSizes = [
  { size: "xs", label: "XS" },
  { size: "sm", label: "SM" },
  { size: "md", label: "MD" },
  { size: "lg", label: "LG" },
];

const badgeVariants = [
  {
    variant: "gray",
    title: "Gray",
    description: "Neutral metadata or default labels.",
  },
  {
    variant: "teal",
    title: "Teal",
    description: "Positive or active state.",
  },
  {
    variant: "amber",
    title: "Amber",
    description: "Warning or attention state.",
  },
  {
    variant: "indigo",
    title: "Indigo",
    description: "Feature, category, or highlight label.",
  },
  {
    variant: "emerald",
    title: "Emerald",
    description: "Confirmed or successful state.",
  },
  {
    variant: "glass",
    title: "Glass",
    description: "Use on dark or image backgrounds.",
  },
  {
    variant: "midnight",
    title: "Midnight",
    description: "Strong dark label for contrast.",
  },
];

const buttonSnippet = `<Button variant="primary" size="md">
  Create event
</Button>`;

const componentApiSnippet = `import Button from "../components/test_ui/TestButton";
import Badge from "../components/test_ui/TestBadge";
import { Save } from "lucide-react";

function Toolbar({ isSaving, onSave }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="teal">Draft</Badge>
      <Button
        variant="primary"
        size="md"
        icon={<Save size={16} />}
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}`;

const buttonEventSnippet = `function Example() {
  function handleCreateEvent() {
    // Keep business logic outside the Button component.
    createEvent();
  }

  return (
    <Button type="button" onClick={handleCreateEvent}>
      Create event
    </Button>
  );
}`;

const iconButtonSnippet = `import { Save, ArrowRight, Plus } from "lucide-react";

<Button icon={<Save size={16} />} iconPosition="left">
  Save changes
</Button>

<Button icon={<ArrowRight size={16} />} iconPosition="right">
  Continue
</Button>

<Button iconOnly icon={<Plus size={18} />} aria-label="Create event" />`;

const badgeSnippet = `<Badge variant="teal">Joined</Badge>`;

const cardComponentSnippet = `function EventPreviewCard({ event, onJoin }) {
  return (
    // Card shell: shared radius token, border, white background, inner spacing.
    <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
      {/* Image: fixed height, full width, crop image without distortion. */}
      <img
        src={event.image}
        alt=""
        className="h-40 w-full rounded-[var(--radius-card)] object-cover"
      />

      {/* Metadata row: flex layout with consistent gap between badges. */}
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="teal">{event.level}</Badge>
        <Badge variant="gray">{event.sport}</Badge>
      </div>

      {/* Text content: title is strong, location is quieter. */}
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{event.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{event.location}</p>

      {/* Event callback: the card does not know backend details. */}
      <Button className="mt-4" onClick={() => onJoin(event.id)}>
        Join event
      </Button>
    </article>
  );
}`;

const cardWithApiSnippet = `import { useEffect, useState } from "react";
import { getEvents, joinEvent } from "../api/eventsApi";
import Button from "../components/test_ui/TestButton";
import Badge from "../components/test_ui/TestBadge";

function EventsPreviewList() {
  // Page state: backend data, loading state, and user-facing error.
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setIsLoading(true);
      setError("");
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Load data when the page opens.
    loadEvents();
  }, []);

  async function handleJoin(eventId) {
    // Mutate backend first, then refresh affected list.
    await joinEvent(eventId);
    await loadEvents();
  }

  if (isLoading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventPreviewCard
          key={event.id}
          event={event}
          onJoin={handleJoin}
        />
      ))}
    </div>
  );
}`;

const apiModuleSnippet = `import { apiRequest } from "./client";
import { EventItem } from "../types/api";

export function getEvent(id: string) {
  return apiRequest<EventItem>(\`/api/events/\${id}/\`);
}

export function joinEvent(id: string) {
  return apiRequest<{ success: boolean; status: string }>(
    \`/api/events/\${id}/join/\`,
    { method: "POST" },
  );
}`;

const apiComponentSnippet = `import { useEffect, useState } from "react";
import { getEvent, joinEvent } from "../api/eventsApi";

function EventDetails({ eventId }) {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadEvent() {
      try {
        setIsLoading(true);
        setError("");
        const data = await getEvent(eventId);
        if (!ignore) setEvent(data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadEvent();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  async function handleJoin() {
    await joinEvent(eventId);
    const freshEvent = await getEvent(eventId);
    setEvent(freshEvent);
  }

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return <Button onClick={handleJoin}>Join event</Button>;
}`;

const apiFormDataSnippet = `export function updateMe(payload) {
  const form = new FormData();
  form.append("district", payload.district);
  if (payload.avatarFile) form.append("avatar", payload.avatarFile);

  // apiRequest detects FormData and does not set JSON Content-Type.
  return apiRequest("/api/auth/me/", {
    method: "PATCH",
    body: form,
  });
}`;

export function UiElementsTest() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          UI system demo
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Buttons and badges
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          We use Tailwind CSS in this project for fast layout, spacing, and
          component composition. If a teammate prefers CSS Modules, vanilla CSS,
          or another library, that is fine too. The important part is to keep the
          component API predictable and document any trade-offs.
        </p>
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">How to add a new component</h2>
        <ol className="list-decimal space-y-2 pl-6 text-slate-700">
          <li>Start with a small API. Keep props focused on behavior, not styling noise.</li>
          <li>Use Tailwind for local spacing, alignment, and responsive layout.</li>
          <li>Store repeated color choices in global CSS variables so the palette stays consistent.</li>
          <li>Use radius variables for shared shapes: <code>--radius-card</code>, <code>--radius-button</code>, and <code>--radius-badge</code>.</li>
          <li>Add the new component to this demo page with a short description and at least one usage example.</li>
          <li>If you choose another library, explain why in the component comment and keep the public API the same.</li>
        </ol>
      </section>

      <section className="card space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Quick Tailwind guide</h2>
          <p className="mt-2 text-slate-600">
            Tailwind classes are small single-purpose utilities. Read them from
            left to right: layout first, then spacing, then size, then color,
            then states like <code>hover:</code> or responsive prefixes like
            <code> md:</code>.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Spacing</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>p-4</code> means padding. <code>m-4</code> means margin.
              <code> mt-4</code> means margin-top. <code>gap-4</code> controls
              space between flex/grid children.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Layout</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>flex</code> is for one-dimensional rows or columns.
              <code> grid</code> is for card layouts. <code>items-center</code>
              aligns vertically. <code>justify-between</code> pushes content apart.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Responsive classes</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>md:grid-cols-2</code> applies from medium screens up.
              <code> xl:grid-cols-3</code> applies from extra-large screens up.
              Start mobile-first, then add larger breakpoints.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Text</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>text-sm</code> controls font size. <code>font-semibold</code>
              controls weight. <code>leading-6</code> controls line height.
              <code> text-slate-600</code> controls color.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Borders and radius</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>border</code> adds a border. <code>border-slate-200</code>
              sets its color. For shared components, prefer our tokens:
              <code> rounded-[var(--radius-card)]</code>.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">States</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>hover:bg-slate-50</code> applies on hover.
              <code> disabled:opacity-50</code> applies when disabled.
              Use states in shared components, not copied across every page.
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Team rule of thumb</p>
          <p className="mt-2">
            Tailwind is great for layout and one-off page composition. If a
            visual pattern repeats, turn it into a shared component or a design
            token instead of copying the same long class list everywhere.
          </p>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">Using our component API</h2>
        <p className="text-slate-600">
          Treat shared UI components as small public APIs. The goal is that a
          teammate can read the props and understand the component without
          opening its CSS.
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-slate-700">
          <li>Import the shared component first. Use <code>Button</code> for actions and <code>Badge</code> for labels before creating new markup.</li>
          <li>Pick semantic props before adding custom classes: <code>variant</code>, <code>size</code>, <code>icon</code>, <code>iconPosition</code>, <code>iconOnly</code>, and <code>disabled</code>.</li>
          <li>Pass events from the parent as callbacks, for example <code>onSave</code>, <code>onJoin</code>, or <code>onDelete</code>. The UI component should not know business logic.</li>
          <li>Use <code>type="button"</code> for normal clicks and <code>type="submit"</code> only inside forms that should submit.</li>
          <li>For icon-only buttons, always pass an <code>aria-label</code>. A visual icon is not enough for screen readers.</li>
          <li>Use <code>className</code> only for layout around the component, such as <code>mt-4</code> or <code>w-full</code>. If many places need the same visual change, add a prop instead.</li>
          <li>If the API is missing something, update the shared component and this page together so the pattern stays documented.</li>
        </ol>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">API example</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This example combines a status badge, an icon button, disabled
              state, and a parent-owned save event.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge variant="teal">Draft</Badge>
              <Button icon={<Save size={16} />} onClick={() => setClickCount((count) => count + 1)}>
                Save
              </Button>
              <Button icon={<Save size={16} />} disabled>
                Saving...
              </Button>
            </div>
          </div>
          <pre>{componentApiSnippet}</pre>
        </div>
      </section>

      <section className="card space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Using our backend API</h2>
          <p className="mt-2 text-slate-600">
            Frontend components should not call <code>fetch</code> directly.
            Put backend calls in <code>src/api/*Api.ts</code>, then import those
            small functions into pages and components. This keeps auth headers,
            JSON parsing, file uploads, and error handling consistent.
          </p>
        </div>

        <ol className="list-decimal space-y-2 pl-6 text-slate-700">
          <li>Check whether an API module already exists: <code>authApi.ts</code>, <code>eventsApi.ts</code>, or <code>geoApi.ts</code>.</li>
          <li>Create or reuse TypeScript types from <code>src/types/api.ts</code>. The response type should describe what Django returns.</li>
          <li>Add one small function per endpoint. Use <code>apiRequest&lt;ResponseType&gt;()</code> instead of raw <code>fetch</code>.</li>
          <li>For query strings, use <code>URLSearchParams</code>. Do not build long query strings by hand.</li>
          <li>For normal JSON requests, pass <code>body: JSON.stringify(payload)</code>. <code>apiRequest</code> adds <code>Content-Type: application/json</code>.</li>
          <li>For file uploads, use <code>FormData</code>. <code>apiRequest</code> detects it and lets the browser set the multipart boundary.</li>
          <li>In the UI, keep <code>isLoading</code>, <code>error</code>, and data state close to the page that uses them.</li>
          <li>After a mutation like join, leave, create, or upload, refresh the affected data or update local state intentionally.</li>
          <li>If the request requires login, do nothing special in the component. <code>apiRequest</code> automatically sends the saved access token.</li>
        </ol>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">API helper rule</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <code>apiRequest</code> is our single gateway to Django. It adds
              the backend base URL, attaches the JWT token, parses JSON, supports
              <code> FormData</code>, and throws an error when the response is
              not OK. That means pages can focus on product behavior instead of
              repeating networking details.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="teal">Auth token</Badge>
              <Badge variant="indigo">JSON</Badge>
              <Badge variant="amber">FormData</Badge>
              <Badge variant="gray">Errors</Badge>
            </div>
          </div>
          <pre>{apiModuleSnippet}</pre>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <pre>{apiComponentSnippet}</pre>
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Component usage pattern</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use <code>useEffect</code> for loading data when a page opens or
              when an id/filter changes. Use event handlers for user actions
              like save, join, leave, delete, or upload. Avoid putting backend
              logic inside reusable UI components such as <code>Button</code>,
              <code> Badge</code>, or future cards.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Files and images</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use <code>FormData</code> when sending avatars, event images, or
              mixed data plus a file. Do not manually set
              <code> Content-Type</code> for multipart requests. The browser
              must add the boundary itself.
            </p>
          </div>
          <pre>{apiFormDataSnippet}</pre>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">Global styles and theme notes</h2>
        <p className="text-slate-600">
          <code>global.css</code> still has a few legacy button selectors like
          <code> button.secondary</code>. They are kept for older pages, but new
          UI should use the shared <code>Button</code> component so variants,
          icons, disabled state, radius, and events are handled in one place.
        </p>
        <p className="text-slate-600">
          The current dark mode stores a value in <code>localStorage</code> and
          toggles <code>body.dark</code>. That works for a prototype, but the
          better approach is a root <code>data-theme</code> attribute, CSS
          variables for both themes, <code>prefers-color-scheme</code> as the
          default, and a tiny script in <code>index.html</code> that sets the
          theme before React renders.
        </p>
        <p className="text-slate-600">
          Use <code>global-test.css</code> as a reference library for useful
          variables and experiments. Move only stable tokens into
          <code> global.css</code> after the component design is agreed.
        </p>
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">Radius tokens</h2>
        <p className="text-slate-600">
          Border radius is part of the visual language. Do not pick a random
          <code> rounded-*</code> class for shared components. Use the global
          variables below so cards, buttons, and badges keep a consistent shape.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-slate-200 bg-white p-4 rounded-[var(--radius-card)]">
            <p className="font-semibold text-slate-950">Cards</p>
            <code className="mt-2 block text-sm text-slate-600">var(--radius-card)</code>
          </div>
          <div className="border border-slate-200 bg-white p-4 rounded-[var(--radius-button)]">
            <p className="font-semibold text-slate-950">Buttons</p>
            <code className="mt-2 block text-sm text-slate-600">var(--radius-button)</code>
          </div>
          <div className="border border-slate-200 bg-white p-4 rounded-[var(--radius-badge)]">
            <p className="font-semibold text-slate-950">Badges</p>
            <code className="mt-2 block text-sm text-slate-600">var(--radius-badge)</code>
          </div>
        </div>
      </section>

      <section className="card space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Buttons</h2>
          <p className="mt-2 text-slate-600">
            The button component keeps one job: show a clear action. Variants
            only change emphasis. Sizes only change density.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buttonVariants.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
              <div
                className={
                  item.variant === "glass"
                    ? "mt-4 flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] bg-gradient-to-br from-slate-950 via-teal-900 to-slate-800 p-4"
                    : "mt-4 flex flex-wrap items-center gap-2"
                }
              >
                {buttonSizes.map((size) => (
                  <Button key={size.size} variant={item.variant} size={size.size}>
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <pre>{buttonSnippet}</pre>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">When to add a new button variant</p>
            <p className="mt-2 leading-6">
              Add a variant only when it carries a real product meaning. If the
              only difference is spacing or placement, prefer props like <code>size</code>{" "}
              or regular utility classes around the component.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Buttons with icons</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We use <code>lucide-react</code> for icons. Import only the icons
              you need, pass them through the <code>icon</code> prop, and use
              <code> iconOnly</code> for compact tool buttons. Icon-only buttons
              must always have an <code>aria-label</code>.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button icon={<Save size={16} />} iconPosition="left">
                Save changes
              </Button>
              <Button
                variant="outline"
                icon={<ArrowRight size={16} />}
                iconPosition="right"
              >
                Continue
              </Button>
              <Button
                variant="indigo"
                iconOnly
                icon={<Plus size={18} />}
                aria-label="Create event"
              />
              <Button
                variant="danger"
                iconOnly
                icon={<Trash2 size={18} />}
                aria-label="Delete event"
              />
            </div>
          </div>
          <pre>{iconButtonSnippet}</pre>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Button events</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Buttons receive normal React events. Pass a named handler through
              <code> onClick</code>, keep side effects in the parent component,
              and set <code>type="button"</code> unless the button submits a form.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => setClickCount((count) => count + 1)}>
                Count click
              </Button>
              <Button variant="outline" onClick={() => setClickCount(0)}>
                Reset
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <span className="text-sm font-medium text-slate-700">
                Clicks: {clickCount}
              </span>
            </div>
          </div>
          <pre>{buttonEventSnippet}</pre>
        </div>
      </section>

      <section className="card space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Badges</h2>
          <p className="mt-2 text-slate-600">
            Badges are labels, not actions. They should be short, readable, and
            consistent across the app.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badgeVariants.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
              <div className="mt-4">
                <Badge variant={item.variant}>{item.title}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <pre>{badgeSnippet}</pre>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Badge guidance</p>
            <p className="mt-2 leading-6">
              Use badges for status, category, or short metadata. If the label
              needs to trigger an action, it is probably a button instead.
            </p>
          </div>
        </div>
      </section>

      <section className="card space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Step-by-step component recipe</h2>
          <p className="mt-2 text-slate-600">
            Example: a card with an image, text, badges, buttons, and events.
          </p>
        </div>
        <ol className="list-decimal space-y-2 pl-6 text-slate-700">
          <li>Create a small props API first: data props, event callbacks, and optional visual variants.</li>
          <li>Use existing shared components before writing new UI: <code>Button</code> for actions and <code>Badge</code> for labels.</li>
          <li>Use global tokens for shared shape and color decisions: <code>--radius-card</code>, <code>--radius-button</code>, <code>--radius-badge</code>, and badge/button colors.</li>
          <li>Keep events in the parent: pass callbacks like <code>onJoin</code>, <code>onDelete</code>, or <code>onOpen</code> into the card.</li>
          <li>Use lucide icons for recognizable actions, especially icon-only tool buttons.</li>
          <li>Add loading, disabled, empty, and error states when the component talks to the backend.</li>
          <li>Add the component to this page with realistic sample data and a short code example.</li>
        </ol>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
            <div className="flex h-40 items-center justify-center rounded-[var(--radius-card)] bg-gradient-to-br from-teal-100 via-white to-amber-100 text-slate-500">
              Image area
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="teal" icon={<Star size={12} />}>Beginner</Badge>
              <Badge variant="gray">Football</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-950">Sunday game in Prater</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A compact card should show the useful facts first and leave actions easy to scan.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => setClickCount((count) => count + 1)}>
                Join event
              </Button>
              <Button variant="outline" iconOnly icon={<ArrowRight size={18} />} aria-label="Open event" />
            </div>
          </div>
          <pre>{cardComponentSnippet}</pre>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Using the card with backend data</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The page owns the API calls and passes plain data plus callbacks
              into the card. This keeps <code>EventPreviewCard</code> reusable:
              it can be used with real backend data, mock data, or story/demo
              data without changing the card itself.
            </p>
          </div>
          <pre>{cardWithApiSnippet}</pre>
        </div>
      </section>
    </div>
  );
}

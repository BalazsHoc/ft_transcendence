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
    <article className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
      <img src={event.image} alt="" className="h-40 w-full object-cover rounded-[var(--radius-card)]" />
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="teal">{event.level}</Badge>
        <Badge variant="gray">{event.sport}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{event.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{event.location}</p>
      <Button className="mt-4" onClick={() => onJoin(event.id)}>
        Join event
      </Button>
    </article>
  );
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
      </section>
    </div>
  );
}

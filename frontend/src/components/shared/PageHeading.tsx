import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PageHeadingProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * Shared heading treatment for top-level pages.
 *
 * Keeping the icon, type scale, divider, and responsive spacing in one place
 * makes list pages feel like the Chats page while allowing each page to pass
 * its own icon and actions.
 */
export function PageHeading({
  icon: Icon,
  title,
  description,
  actions,
}: PageHeadingProps) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-[var(--surface-border)] pb-4 md:gap-4 md:pb-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--button-bg)] text-[var(--button-text)] md:h-14 md:w-14 md:rounded-2xl">
        <Icon size={26} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="font-display text-2xl font-bold text-[var(--text)] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="hidden text-sm text-[var(--muted)] md:block md:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
    </header>
  );
}

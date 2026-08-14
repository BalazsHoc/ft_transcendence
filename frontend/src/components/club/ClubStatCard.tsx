import type { LucideIcon } from "lucide-react";
import { Award, ChevronDown, History, Users } from "lucide-react";

type ClubStatCardProps = {
  icon: LucideIcon;
  value: string;
  label: string;
  onClick?: () => void;
  expanded?: boolean;
  controlsId?: string;
};

export function ClubStatCard({
  icon: Icon,
  value,
  label,
  onClick,
  expanded = false,
  controlsId,
}: ClubStatCardProps) {
  const className =
    "flex items-center gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm";
  const content = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--text)]">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold text-[var(--text)]">
          {value}
        </p>
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      </div>
      {onClick ? (
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-[var(--muted)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${className} w-full cursor-pointer text-left transition-colors hover:bg-[var(--bg)]`}
        onClick={onClick}
        aria-expanded={expanded}
        aria-controls={controlsId}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export const CLUB_STAT_ICONS = {
  members: Users,
  score: Award,
  established: History,
} as const;

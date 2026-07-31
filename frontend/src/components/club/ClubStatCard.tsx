import type { LucideIcon } from "lucide-react";
import { Users, Award, History } from "lucide-react";

type ClubStatCardProps = {
  icon: LucideIcon;
  value: string;
  label: string;
};

export function ClubStatCard({ icon: Icon, value, label }: ClubStatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--text)]">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold text-[var(--text)]">
          {value}
        </p>
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}

export const CLUB_STAT_ICONS = {
  members: Users,
  score: Award,
  established: History,
} as const;

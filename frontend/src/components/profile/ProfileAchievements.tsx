import { Flame, Medal, Trophy, type LucideIcon } from "lucide-react";

export type Achievement = {
  id: string;
  label: string;
  icon: LucideIcon;
  earned: boolean;
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "workouts", label: "100 Workouts", icon: Medal, earned: false },
  { id: "streak", label: "30 Day Streak", icon: Flame, earned: false },
  { id: "court", label: "Court Master", icon: Trophy, earned: false },
];

type ProfileAchievementsProps = {
  achievements?: Achievement[];
};

// No achievements endpoint exists yet, so every badge defaults to "not
// earned" (greyed out). Pass `achievements` with `earned: true` once the
// backend tracks these.
export function ProfileAchievements({ achievements = DEFAULT_ACHIEVEMENTS }: ProfileAchievementsProps) {
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="mb-4 flex items-center justify-between font-display text-xl font-semibold text-[var(--text)]">
        Achievements
        <span className="rounded-full bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
          {earnedCount}/{achievements.length}
        </span>
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {achievements.map(({ id, label, icon: Icon, earned }) => (
          <div key={id} className="flex flex-col items-center">
            <div
              className={`mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--surface-border)] ${
                earned ? "" : "opacity-40 grayscale"
              }`}
            >
              <Icon size={28} className="text-[var(--text)]" />
            </div>
            <span className="text-center text-xs leading-tight text-[var(--muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

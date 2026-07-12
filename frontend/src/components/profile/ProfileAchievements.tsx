import { useTranslation } from "react-i18next";
import { Flame, Medal, Trophy, type LucideIcon } from "lucide-react";

export type Achievement = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  earned: boolean;
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "workouts", labelKey: "profile.achievementWorkouts", icon: Medal, earned: false },
  { id: "streak", labelKey: "profile.achievementStreak", icon: Flame, earned: false },
  { id: "court", labelKey: "profile.achievementCourtMaster", icon: Trophy, earned: false },
];

type ProfileAchievementsProps = {
  achievements?: Achievement[];
};

// No achievements endpoint exists yet, so every badge defaults to "not
// earned" (greyed out). Pass `achievements` with `earned: true` once the
// backend tracks these.
export function ProfileAchievements({ achievements = DEFAULT_ACHIEVEMENTS }: ProfileAchievementsProps) {
  const { t } = useTranslation();
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="mb-4 flex items-center justify-between font-display text-xl font-semibold text-[var(--text)]">
        {t("profile.achievements")}
        <span className="rounded-full bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
          {earnedCount}/{achievements.length}
        </span>
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {achievements.map(({ id, labelKey, icon: Icon, earned }) => (
          <div key={id} className="flex flex-col items-center">
            <div
              className={`mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--surface-border)] ${
                earned ? "" : "opacity-40 grayscale"
              }`}
            >
              <Icon size={28} className="text-[var(--text)]" />
            </div>
            <span className="text-center text-xs leading-tight text-[var(--muted)]">{t(labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

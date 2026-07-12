import { useTranslation } from "react-i18next";

type ProfileScoreCardProps = {
  score?: number;
  title?: string;
  description?: string;
};

// The backend has no "community score" field yet — this renders whatever
// score is passed in (default 0) so it's a one-line swap once that data exists.
export function ProfileScoreCard({ score = 0, title, description }: ProfileScoreCardProps) {
  const { t } = useTranslation();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(score, 100)) / 100;

  return (
    <div className="flex items-center gap-8 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-8 shadow-sm">
      <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--surface-border)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--text)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-[var(--text)]">{score}</span>
          <span className="text-xs text-[var(--muted)]">{t("profile.score")}</span>
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold text-[var(--text)]">
          {title ?? t("profile.communityScore")}
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {description ?? t("profile.communityScoreDescription")}
        </p>
      </div>
    </div>
  );
}

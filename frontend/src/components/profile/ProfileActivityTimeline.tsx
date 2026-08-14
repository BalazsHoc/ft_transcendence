import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";

export type ActivityItem = {
  id: string;
  title: string;
  time: string;
  description: string;
  status: "upcoming" | "past";
};

type ProfileActivityTimelineProps = {
  items?: ActivityItem[];
  loading?: boolean;
};

const DEFAULT_ITEMS: ActivityItem[] = [];

export function ProfileActivityTimeline({
  items = DEFAULT_ITEMS,
  loading = false,
}: ProfileActivityTimelineProps) {
  const { t } = useTranslation();
  const sections = [
    {
      key: "upcoming",
      title: t("profile.upcomingActivities"),
      items: items.filter((item) => item.status === "upcoming"),
    },
    {
      key: "past",
      title: t("profile.pastActivities"),
      items: items.filter((item) => item.status === "past"),
    },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-8 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold text-[var(--text)]">
        <CalendarDays size={20} />
        {t("profile.activityHistory")}
      </h3>

      {loading ? (
        <div className="flex min-h-16 items-center">
          <p className="text-sm text-[var(--muted)]">{t("profile.loadingActivity")}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-16 items-center">
          <p className="text-sm text-[var(--muted)]">{t("profile.noActivity")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.key}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                {section.title}
              </h4>
              <div className="relative ml-4 space-y-6 border-l-2 border-[var(--surface-border)] pb-1">
                {section.items.map((item) => (
                  <div key={item.id} className="relative pl-8">
                    <div
                      className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[var(--surface)] ${
                        item.status === "upcoming" ? "bg-[var(--button-bg)]" : "bg-[var(--muted)]"
                      }`}
                    />
                    <div className="rounded-2xl border border-[var(--surface-border)] p-4 transition-shadow hover:shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h5 className="font-medium text-[var(--text)]">{item.title}</h5>
                        <span className="shrink-0 text-xs text-[var(--muted)]">{item.time}</span>
                      </div>
                      <p className="text-sm text-[var(--muted)]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

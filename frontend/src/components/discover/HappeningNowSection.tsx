import { useTranslation } from "react-i18next";

import { EventItem } from "../../types/api";
import { LiveEventCard } from "./LiveEventCard";

interface HappeningNowSectionProps {
  events: EventItem[];
  onCardClick: (id: string) => void;
}

export function HappeningNowSection({
  events,
  onCardClick,
}: HappeningNowSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />

        <h2 className="text-2xl font-bold text-[var(--text)]">
          {t("discover.happeningNow")}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {events.slice(0, 2).map((event) => (
          <LiveEventCard
            key={event.id}
            image={event.image}
            status={
              event.status === "started"
                ? t("discover.sessionStarted")
                : t("discover.liveMatch")
            }
            sport={event.sport}
            title={event.title}
            location={event.location_name}
            onClick={() => onCardClick(event.id)}
          />
        ))}
      </div>
    </section>
  );
}
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
        <h2 className="text-2xl font-bold text-[var(--text)]">
          {t("discover.happeningNow")}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {events.slice(0, 2).map((event, index) => (
          <LiveEventCard
            key={event.id}
            image={event.image}
            status={
              index === 0
                ? t("discover.sessionStarted")
                : t("discover.liveMatch")
            }
            sport={t(`discover.${event.sport.toLowerCase()}`, {
              defaultValue: event.sport,
            })}
            title={event.title}
            location={event.location_name}
            onClick={() => onCardClick(event.id)}
          />
        ))}
      </div>
    </section>
  );
}
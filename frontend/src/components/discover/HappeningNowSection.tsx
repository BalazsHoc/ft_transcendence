import { useTranslation } from "react-i18next";

import { EventItem } from "../../types/api";
import { LiveEventCard } from "./LiveEventCard";
// import { LiveEventCard } from "../events/EventCard";

const SPORT_FALLBACK_IMAGES: Record<string, string> = {
  tennis: "/tennis.jpg",
  running: "/running.jpeg",
  cycling: "/cycling.jpeg",
  chess: "/chess.jpeg",
  football: "/football-prater.jpg",
};

interface HappeningNowSectionProps {
  events: EventItem[];
  onCardClick: (id: string) => void;
}

export function HappeningNowSection({
  events,
  onCardClick,
}: HappeningNowSectionProps) {
  const { t } = useTranslation();

  
  const liveEvents = events.filter((event) => {
    const now = new Date(event.start_at);     //new Date(); FOR TESTING PURPOSES
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);

    return start <= now && now <= end;
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-[var(--text)]">
          {t("discover.happeningNow")}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {liveEvents.slice(0, 2).map((event) => (
          <LiveEventCard
            key={event.id}
            image={event.image || SPORT_FALLBACK_IMAGES[event.sport.toLowerCase()]}
            status={t("discover.liveMatch")}
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
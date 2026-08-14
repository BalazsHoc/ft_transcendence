import { EventItem } from "../../types/api";
import { EventCard } from "../events/EventCard";
import { useTranslation } from "react-i18next";

type EventsSectionProps = {
  events: EventItem[];
  onCardClick: (id: string) => void;
};

export function EventsSection({ events, onCardClick }: EventsSectionProps) {
  const { t } = useTranslation();
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-2xl font-semibold">{t("discover.events")}</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onCardClick(event.id)}
            className="cursor-pointer"
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  );
}


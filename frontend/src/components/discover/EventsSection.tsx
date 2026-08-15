import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EventItem } from "../../types/api";
import { useAuth } from "../../features/auth/AuthContext";
import { EventCard } from "../events/EventCard";
import Button from "../shared/Button";

type EventsSectionProps = {
  events: EventItem[];
  onCardClick: (id: string) => void;
};

export function EventsSection({ events, onCardClick }: EventsSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{t("discover.events")}</h2>
        {user && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => navigate("/events/new")}
          >
            {t("nav.createEvent")}
          </Button>
        )}
      </div>

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

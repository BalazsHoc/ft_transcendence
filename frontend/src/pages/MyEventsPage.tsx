import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getEvents } from "../api/eventsApi";
import { EventItem } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { EventCard } from "../components/events/EventCard";

export function MyEventsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(console.error);
  }, []);

  const created = events.filter((e) => e.creator?.id === user?.id);
  const joined = events.filter((e) => e.user_status);

  return (
    <>
      <h1 className="text-3xl font-bold">{t("myEvents.title")}</h1>

      <section className="card">
        <h2 className="text-xl font-bold">{t("myEvents.created")}</h2>
        <div className="event-list">
          {created.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">{t("myEvents.joined")}</h2>
        <div className="event-list">
          {joined.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>
    </>
  );
}
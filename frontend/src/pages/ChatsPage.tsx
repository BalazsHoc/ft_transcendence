import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventChat } from "../components/chat/EventChat";
import { getEvents } from "../api/eventsApi";
import { EventItem } from "../types/api";

export function ChatsPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    getEvents()
      .then((data) => {
        const joinedEvents = (Array.isArray(data) ? data : []).filter((event) => event.user_status);
        setEvents(joinedEvents);
        setSelected(joinedEvents[0]?.id || "");
      })
      .catch(console.error);
  }, []);

  const selectedEvent = events.find((event) => event.id === selected) || null;

  return (
    <>
      <h1>{t("chats.title")}</h1>
      <div className="two-column">
        <aside className="sidebar-list">
          <h3>{t("chats.selectEvent")}</h3>
          {events.length === 0 ? (
            <p>You do not have any joined event chats yet.</p>
          ) : (
            events.map((event) => (
              <button key={event.id} onClick={() => setSelected(event.id)}>
                {event.title}
              </button>
            ))
          )}
        </aside>

        {selectedEvent ? (
          <EventChat eventId={selectedEvent.id} />
        ) : (
          <p>Join an event to see its chat here.</p>
        )}
      </div>
    </>
  );
}

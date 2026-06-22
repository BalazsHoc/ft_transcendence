import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EventForm } from "../components/events/EventForm";
import { EventItem } from "../types/api";
import { EventPayload, getEvent, updateEvent } from "../api/eventsApi";
import { ApiLog } from "../components/shared/ApiLog";

export function EditEventPage() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [log, setLog] = useState("");

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then(setEvent).catch((e) => setLog(e.message));
  }, [eventId]);

  async function submit(payload: EventPayload) {
    if (!eventId) return;
    const updated = await updateEvent(eventId, payload);
    navigate(`/events/${updated.id}`);
  }

  return (
    <>
      <h1>{t("editEvent.title")}</h1>
      {event ? <EventForm initialEvent={event} onSubmit={submit} /> : <p>Loading...</p>}
      <ApiLog log={log} />
    </>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "../components/events/EventForm";
import type { EventItem } from "../types/api";
import { type EventPayload, getEvent, updateEvent } from "../api/eventsApi";
import Button from "../components/shared/Button";

export function EditEventPage() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setError(null);
    setEvent(null);
    getEvent(eventId)
      .then(setEvent)
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : String(loadError)),
      );
  }, [eventId]);

  async function submit(payload: EventPayload) {
    if (!eventId) return;
    const updated = await updateEvent(eventId, payload);
    navigate(`/events/${updated.id}`);
  }

  function cancel() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(eventId ? `/events/${eventId}` : "/discover");
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {t("editEvent.title")}
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)] md:text-base">
            {t("editEvent.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={cancel}
        >
          {t("createEvent.cancel")}
        </Button>
      </header>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : event ? (
        <EventForm initialEvent={event} onSubmit={submit} onCancel={cancel} />
      ) : (
        <p className="text-[var(--muted)]">{t("editEvent.loading")}</p>
      )}
    </main>
  );
}

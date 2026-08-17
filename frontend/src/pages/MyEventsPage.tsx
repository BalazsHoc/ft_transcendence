import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarCheck } from "lucide-react";
import { getEvents } from "../api/eventsApi";
import { EventItem } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { EventCard } from "../components/events/EventCard";
import { PageHeading } from "../components/shared/PageHeading";

export function MyEventsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("myEvents.loadError"));
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const created = events.filter((e) => e.creator?.id === user?.id);
  const joined = events.filter((e) => e.user_status);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:py-10">
      <PageHeading
        icon={CalendarCheck}
        title={t("myEvents.title")}
        description={t("myEvents.description")}
      />

      {loadError ? (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      ) : null}

      <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
        <h2 className="mb-5 text-xl font-bold text-[var(--text)]">{t("myEvents.created")}</h2>
        {created.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("myEvents.emptyCreated")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {created.map((event) => (
              <div key={event.id} className="[&>article]:mb-0">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
        <h2 className="mb-5 text-xl font-bold text-[var(--text)]">{t("myEvents.joined")}</h2>
        {joined.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("myEvents.emptyJoined")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {joined.map((event) => (
              <div key={event.id} className="[&>article]:mb-0">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

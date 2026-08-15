import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getUserActivities } from "../../api/usersApi";
import { useAuth } from "../../features/auth/AuthContext";
import type { EventItem } from "../../types/api";
import { EventCard } from "../events/EventCard";

const MAX_EVENTS = 6;

export function HomeUpcomingEvents() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getUserActivities(user.id)
      .then((data) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = (Array.isArray(data) ? data : [])
          .filter((event) => {
            const end = new Date(event.end_at).getTime();
            return !Number.isNaN(end) && end >= now;
          })
          .sort(
            (a, b) =>
              new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
          )
          .slice(0, MAX_EVENTS);
        setEvents(upcoming);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--text)]">
          {t("home.upcomingTitle")}
        </h2>
        <Link
          to="/my-events"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          {t("home.seeAllEvents")}
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-[var(--muted)]">{t("notifications.loading")}</p>
      )}

      {!loading && events.length === 0 && (
        <p className="text-sm text-[var(--muted)]">{t("home.upcomingEmpty")}</p>
      )}

      {!loading && events.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="cursor-pointer"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

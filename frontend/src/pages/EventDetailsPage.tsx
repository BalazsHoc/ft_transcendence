import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EventChat } from "../components/chat/EventChat";
import { EventItem } from "../types/api";
import { getEvent, joinEvent, leaveEvent } from "../api/eventsApi";
import { useAuth } from "../features/auth/AuthContext";
import eventStyles from "../components/events/EventCard.module.css";
import { DEFAULT_EVENT_IMAGE_SRC, resolveMediaUrl } from "../utils/media";
import { Badge } from "../components/shared/Badge";
import Button from "../components/shared/Button";

export function EventDetailsPage() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(options?: { silent?: boolean }) {
    if (!eventId) return;
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      setEvent(await getEvent(eventId));
      setError(null);
    } catch (loadError: unknown) {
      setEvent(null);
      setError(
        loadError instanceof Error ? loadError.message : t("event.loadError"),
      );
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  async function join() {
    if (!eventId || busy) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await joinEvent(eventId);
      await load({ silent: true });
    } catch (joinError: unknown) {
      setActionError(
        joinError instanceof Error ? joinError.message : t("club.rides.rsvpError"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!eventId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await leaveEvent(eventId);
      await load({ silent: true });
    } catch (leaveError: unknown) {
      setActionError(
        leaveError instanceof Error ? leaveError.message : t("club.rides.rsvpError"),
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [eventId]);

  if (loading) {
    return <p className="text-[var(--muted)]">{t("event.loading")}</p>;
  }

  if (error || !event || !eventId) {
    return (
      <div className="space-y-4">
        <p role="alert">{error || t("event.loadError")}</p>
        <Button variant="primary" size="sm" onClick={() => navigate(-1)}>
          {t("event.back")}
        </Button>
      </div>
    );
  }

  const isCreator = Boolean(user && user.id === event.creator.id);
  const hasJoined =
    event.user_status?.status === "attending" ||
    event.user_status?.status === "waiting";
  const canUseChat = isCreator || hasJoined;

  return (
    <>
      <h1>{event.title}</h1>
      <section className="card">
        <img
          src={resolveMediaUrl(event.image, DEFAULT_EVENT_IMAGE_SRC)}
          alt={event.title}
          style={{
            width: "100%",
            maxHeight: "320px",
            objectFit: "cover",
            borderRadius: "12px",
            marginBottom: "16px",
          }}
          onError={(eventNode: { currentTarget: HTMLImageElement }) => {
            eventNode.currentTarget.src = DEFAULT_EVENT_IMAGE_SRC;
          }}
        />
        <p>{event.description}</p>
        {event.group ? (
          <p>
            <Link to={`/groups/${event.group.id}`} className="inline-flex">
              <Badge variant="yellow">
                {t("event.groupEvent")}: {event.group.name}
              </Badge>
            </Link>
          </p>
        ) : null}
        <p>
          {t("event.sport")}: {event.sport}
        </p>
        <p>
          {t("event.level")}: {event.level}
        </p>
        <p>
          {t("event.location")}: {event.location_name}
        </p>
        {event.location_address && event.location_address !== event.location_name && (
          <p className={eventStyles.eventAddress}>{event.location_address}</p>
        )}
        <p>
          {t("event.start")}: {new Date(event.start_at).toLocaleString()}
        </p>
        <p>
          {t("event.end")}: {new Date(event.end_at).toLocaleString()}
        </p>
        <p>
          {t("event.slots")}: {event.attending_count}/{event.max_slots}, {t("event.waiting")}: {event.waiting_count}
        </p>
        {actionError ? (
          <p role="alert" className="text-red-600">
            {actionError}
          </p>
        ) : null}
        <div className="row">
          {!hasJoined ? (
            <Button variant="primary" size="sm" disabled={busy} onClick={() => void join()}>
              {t("common.join")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void leave()}>
              {t("common.leave")}
            </Button>
          )}
          {isCreator ? (
            <Link className="button secondary" to={`/events/${event.id}/edit`}>
              {t("common.edit")}
            </Link>
          ) : null}
        </div>
      </section>
      <section className="card">
        <h2>{t("event.participants")}</h2>
        {event.participants.map((p) => (
          <p key={p.id}>
            {p.user.username}: {p.status} #{p.queue_position}
          </p>
        ))}
      </section>
      <h2>{t("event.messages")}</h2>
      {canUseChat ? (
        <EventChat eventId={eventId} eventTitle={event.title} />
      ) : (
        <p className="text-sm text-[var(--muted)]">{t("event.chatJoinPrompt")}</p>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, Clock3, MapPin, PencilLine, Users } from "lucide-react";
import { EventChat } from "../components/chat/EventChat";
import { ApiLog } from "../components/shared/ApiLog";
import { Badge } from "../components/shared/Badge";
import Button from "../components/shared/Button";
import { EventItem } from "../types/api";
import { getEvent, joinEvent, leaveEvent } from "../api/eventsApi";
import { DEFAULT_AVATAR_SRC, DEFAULT_EVENT_IMAGE_SRC, resolveMediaUrl } from "../utils/media";
import { useAuth } from "../features/auth/AuthContext";

const getParticipantAvatar = (avatar?: string | null) =>
  resolveMediaUrl(avatar, DEFAULT_AVATAR_SRC);

const formatEventDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function EventDetailsPage() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [log, setLog] = useState("");

  async function load() {
    if (!eventId) return;

    try {
      setEvent(await getEvent(eventId));
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function join() {
    if (!eventId) return;

    try {
      setLog(JSON.stringify(await joinEvent(eventId), null, 2));
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function leave() {
    if (!eventId) return;

    try {
      setLog(JSON.stringify(await leaveEvent(eventId), null, 2));
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  useEffect(() => {
    void load();
  }, [eventId]);

  if (!event || !eventId) {
    return <ApiLog log={log || "Loading..."} />;
  }

  const userStatus = event.user_status?.status;
  const isLoggedIn = Boolean(user);
  const isOwner = Boolean(user && event.creator && user.id === event.creator.id);
  const isJoined = userStatus === "attending" || userStatus === "waiting";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface)] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div className="relative h-72 overflow-hidden sm:h-80">
          <img
            src={resolveMediaUrl(event.image, DEFAULT_EVENT_IMAGE_SRC)}
            alt={event.title}
            className="h-full w-full object-cover"
            onError={(eventNode: any) => {
              eventNode.currentTarget.src = DEFAULT_EVENT_IMAGE_SRC;
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/75 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={isJoined ? "green" : "default"}>
                {isJoined ? t("event.attending") : t("event.notJoined")}
              </Badge>
              <Badge>{event.sport}</Badge>
              <Badge>{event.level}</Badge>
            </div>

            <h1 className="m-0 text-2xl font-semibold text-[var(--text)] sm:text-4xl">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            {event.group ? (
              <Link to={`/groups/${event.group.id}`} className="inline-flex">
                <Badge variant="yellow">
                  {t("event.groupEvent")}: {event.group.name}
                </Badge>
              </Link>
            ) : (
              <span />
            )}

            <div className="ml-auto flex flex-wrap gap-3">
              {isLoggedIn && isJoined && (
                <Button variant="primary" onClick={leave}>
                  {t("common.leave")}
                </Button>
              )}

              {isLoggedIn && !isJoined && (
                <Button variant="primary" onClick={join}>
                  {t("common.join")}
                </Button>
              )}

              {isOwner && (
                <Link to={`/events/${event.id}/edit`}>
                  <Button variant="secondary" className="w-full">
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      <PencilLine size={16} />
                      {t("common.edit")}
                    </span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.8fr_0.9fr]">
            <div>
              <p className="mb-5 text-base leading-7 text-[var(--muted)]">
                {event.description || "No description provided yet."}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                    <CalendarDays size={16} />
                    <span>{t("event.start")}</span>
                  </div>

                  <p className="m-0 text-sm text-[var(--text)]">
                    {formatEventDateTime(event.start_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                    <Clock3 size={16} />
                    <span>{t("event.end")}</span>
                  </div>

                  <p className="m-0 text-sm text-[var(--text)]">
                    {formatEventDateTime(event.end_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel)] p-4 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                    <MapPin size={16} />
                    <span>{t("event.location")}</span>
                  </div>

                  <p className="m-0 text-sm font-medium text-[var(--text)]">
                    {event.location_name}
                  </p>

                  {event.location_address && event.location_address !== event.location_name && (
                    <p className="mt-1 m-0 text-sm text-[var(--muted)]">
                      {event.location_address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                <Users size={16} />
                <span>{t("event.participants")}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {t("event.slots")}
                  </p>

                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                    {event.attending_count}/{event.max_slots === 0 ? "∞" : event.max_slots}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {t("event.waiting")}
                  </p>

                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                    {event.waiting_count}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-[var(--surface-border)] pt-4">
                <div className="space-y-3">
                  {event.participants.length === 0 ? (
                    <p className="m-0 text-sm text-[var(--muted)]">
                      {t("event.no_participants")}
                    </p>
                  ) : (
                    event.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={getParticipantAvatar(participant.user.avatar)}
                            alt={participant.user.username}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--surface-border)]"
                            onError={(eventNode: any) => {
                              eventNode.currentTarget.src = DEFAULT_AVATAR_SRC;
                            }}
                          />

                          <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-medium text-[var(--text)]">
                              {participant.user.username}
                            </p>

                            <p className="m-0 text-xs text-[var(--muted)]">
                              {participant.queue_position ? `#${participant.queue_position}` : ""}
                            </p>
                          </div>
                        </div>

                        <Badge variant={participant.status === "attending" ? "green" : "default"}>
                          {participant.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {isLoggedIn && isJoined && (
        <div className="mt-8">
          <section className="rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.03)] sm:p-6">
            <h2 className="mt-0 mb-4 text-xl font-semibold text-[var(--text)]">
              {t("event.messages")}
            </h2>

            <EventChat eventId={eventId} />
          </section>
        </div>
      )}

      <div className="mt-8">
        <ApiLog log={log} />
      </div>
    </div>
  );
}
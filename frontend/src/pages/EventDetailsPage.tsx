import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock, Users } from "lucide-react";

import { EventChat } from "../components/chat/EventChat";
import { EventItem } from "../types/api";
import { getEvent, joinEvent, leaveEvent } from "../api/eventsApi";
import { useAuth } from "../features/auth/AuthContext";
import { ClubHero } from "../components/club/ClubHero";
import { Badge } from "../components/shared/Badge";
import Button from "../components/shared/Button";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import {
  DEFAULT_AVATAR_SRC,
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../utils/media";

function participantName(event: EventItem["participants"][number]) {
  return (
    [event.user.first_name, event.user.last_name].filter(Boolean).join(" ") ||
    event.user.username
  );
}

export function EventDetailsPage() {
  const { t, i18n } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

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
    setLeaveConfirmOpen(false);
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
    return (
      <div className="club-page flex min-h-[calc(100vh-8rem)] px-4 py-8">
        <p className="text-[var(--muted)]">{t("event.loading")}</p>
      </div>
    );
  }

  if (error || !event || !eventId) {
    return (
      <div className="club-page flex min-h-[calc(100vh-8rem)] flex-col gap-4 px-4 py-8">
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
  const isFull =
    event.max_slots > 0 && event.attending_count >= event.max_slots && !hasJoined;
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const timeLabel = `${start.toLocaleString(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  })} – ${end.toLocaleTimeString(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <div className="club-page relative min-h-[calc(100vh-8rem)]">
      <div className="absolute left-4 top-4 z-20 md:left-6 md:top-5">
        <Button
          variant="primary"
          size="sm"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={() => navigate(-1)}
        >
          {t("event.back")}
        </Button>
      </div>

      <ClubHero
        coverImage={event.image || DEFAULT_EVENT_IMAGE_SRC}
        name={event.title}
        description={event.description || t("groups.noDescription")}
        sportLabel={t(`sports.${event.sport}`)}
        cityLabel={event.location_name || t("event.location")}
        showApply={!hasJoined}
        showLeave={hasJoined}
        applyLabel={
          busy
            ? t("club.rides.joining")
            : isFull
              ? t("club.rides.joinWaitlist")
              : t("common.join")
        }
        leaveLabel={busy ? t("club.rides.leaving") : t("common.leave")}
        onApply={!hasJoined && !busy ? () => void join() : undefined}
        onLeave={
          hasJoined && !busy ? () => setLeaveConfirmOpen(true) : undefined
        }
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        title={t("club.rides.leaveConfirmTitle")}
        message={t("club.rides.leaveConfirm", { title: event.title })}
        confirmLabel={t("common.leave")}
        onConfirm={() => void leave()}
        onCancel={() => setLeaveConfirmOpen(false)}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-8">
        {actionError ? (
          <p role="alert" className="text-sm text-red-600">
            {actionError}
          </p>
        ) : null}

        <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge>{t(`discover.${event.level}`)}</Badge>
            {event.group ? (
              <Link to={`/groups/${event.group.id}`} className="inline-flex">
                <Badge variant="yellow">
                  {t("event.groupEvent")}: {event.group.name}
                </Badge>
              </Link>
            ) : null}
            {event.user_status?.status === "attending" ? (
              <Badge variant="green">{t("event.attending")}</Badge>
            ) : null}
            {event.user_status?.status === "waiting" ? (
              <Badge variant="solid">{t("club.rides.statusWaiting")}</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={16} aria-hidden="true" />
              {timeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={16} aria-hidden="true" />
              {t("event.slots")}: {event.attending_count}/{event.max_slots}
              <span aria-hidden="true">·</span>
              {t("event.waiting")}: {event.waiting_count}
            </span>
          </div>
          {event.location_address &&
          event.location_address !== event.location_name ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              {event.location_address}
            </p>
          ) : null}
          {isCreator ? (
            <div className="mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/events/${event.id}/edit`)}
              >
                {t("common.edit")}
              </Button>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">
            {t("event.participants")}
          </h2>
          {event.participants.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {t("event.participantsEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--surface-border)]">
              {event.participants.map((participant) => {
                const name = participantName(participant);
                const to =
                  user && participant.user.id === user.id
                    ? "/profile"
                    : `/users/${participant.user.id}`;
                return (
                  <li key={participant.id}>
                    <Link
                      to={to}
                      className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-[var(--bg)]"
                    >
                      <img
                        src={resolveMediaUrl(
                          participant.user.avatar,
                          DEFAULT_AVATAR_SRC,
                        )}
                        alt={name}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                        onError={(imageEvent: {
                          currentTarget: HTMLImageElement;
                        }) => {
                          imageEvent.currentTarget.src = DEFAULT_AVATAR_SRC;
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text)]">
                          {name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {participant.status === "waiting"
                            ? t("event.waiting")
                            : t("event.attending")}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">
            {t("event.messages")}
          </h2>
          {canUseChat ? (
            <div className="h-[420px]">
              <EventChat eventId={eventId} eventTitle={event.title} />
            </div>
          ) : (
            <p className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)] shadow-sm">
              {t("event.chatJoinPrompt")}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

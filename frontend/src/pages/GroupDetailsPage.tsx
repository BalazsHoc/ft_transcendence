import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { getGroup, getGroupEvents, joinGroup } from "../api/groupsApi";
import { joinEvent, leaveEvent } from "../api/eventsApi";
import type { EventItem, GroupItem } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { ClubHero } from "../components/club/ClubHero";
import { ClubStatsRow } from "../components/club/ClubStatsRow";
import { ClubUpcomingRides } from "../components/club/ClubUpcomingRides";
import type { ClubRideItem } from "../components/club/ClubRideRow";
import Button from "../components/shared/Button";
import { DEFAULT_GROUP_IMAGE_SRC } from "../utils/media";

function levelLabel(level: EventItem["level"], t: (key: string) => string) {
  const key = `discover.${level}` as const;
  const translated = t(key);
  return translated === key ? level : translated;
}

function kindLabel(
  kind: GroupItem["kind"],
  t: (key: string, options?: Record<string, string>) => string,
) {
  const map: Record<GroupItem["kind"], string> = {
    training: t("groupsTest.kindTraining"),
    social: t("groupsTest.kindSocial"),
    competitive: t("groupsTest.kindCompetitive"),
    team: t("groupsTest.kindTeam"),
  };
  return map[kind] || kind;
}

function eventToRide(
  event: EventItem,
  locale: string,
  t: (key: string) => string,
): ClubRideItem {
  const start = new Date(event.start_at);
  const status = event.user_status?.status;
  return {
    id: event.id,
    eventId: event.id,
    title: event.title,
    day: start.toLocaleDateString(locale, { day: "numeric" }),
    month: start.toLocaleDateString(locale, { month: "short" }),
    timeLabel: start.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    intensityLabel: levelLabel(event.level, t),
    userStatus:
      status === "attending" || status === "waiting" ? status : null,
  };
}

export function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupItem | null>(null);
  const [rides, setRides] = useState<ClubRideItem[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyNeedsAuth, setApplyNeedsAuth] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpNeedsAuth, setRsvpNeedsAuth] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoadingGroup(true);
    setError(null);

    getGroup(groupId)
      .then((data) => {
        if (!cancelled) setGroup(data);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("groups.loadError"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGroup(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, t]);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoadingEvents(true);
    setRsvpError(null);
    setRsvpNeedsAuth(false);
    setRsvpBusyId(null);

    getGroupEvents(groupId)
      .then((events) => {
        if (cancelled) return;
        const list = Array.isArray(events) ? events : [];
        setRides(
          list.map((event) => eventToRide(event, i18n.language, t)),
        );
      })
      .catch(() => {
        if (!cancelled) setRides([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, user?.id, i18n.language, t]);

  async function handleApply() {
    if (!groupId || joining) return;

    if (!user) {
      setApplyError(null);
      setApplySuccess(null);
      setApplyNeedsAuth(true);
      return;
    }

    if (
      group?.max_members &&
      group.member_count >= group.max_members
    ) {
      setApplyNeedsAuth(false);
      setApplySuccess(null);
      setApplyError(t("groups.applyFull"));
      return;
    }

    setJoining(true);
    setApplyError(null);
    setApplyNeedsAuth(false);
    setApplySuccess(null);
    try {
      const membership = await joinGroup(groupId);
      const refreshed = await getGroup(groupId);
      setGroup(refreshed);
      if (membership?.status === "pending") {
        setApplySuccess(t("groups.applyPending"));
      } else {
        setApplySuccess(t("groups.applyJoined"));
      }
    } catch (err) {
      const raw =
        err instanceof Error && err.message
          ? err.message
          : t("groups.applyError");
      const isAuthError =
        /authenticat|credentials|unauthorized|not provided/i.test(raw);
      if (isAuthError) {
        setApplyNeedsAuth(true);
        setApplyError(null);
        return;
      }
      if (/member limit|reached its member/i.test(raw)) {
        setApplyError(t("groups.applyFull"));
        return;
      }
      if (/invite only/i.test(raw)) {
        setApplyError(t("groups.applyInviteOnly"));
        return;
      }
      setApplyError(raw);
    } finally {
      setJoining(false);
    }
  }

  async function handleRsvp(ride: ClubRideItem) {
    if (!ride.eventId || rsvpBusyId) return;

    if (!user) {
      setRsvpError(null);
      setRsvpNeedsAuth(true);
      return;
    }

    const isLeaving =
      ride.userStatus === "attending" || ride.userStatus === "waiting";

    setRsvpBusyId(ride.id);
    setRsvpError(null);
    setRsvpNeedsAuth(false);
    try {
      if (isLeaving) {
        await leaveEvent(ride.eventId);
        setRides((current) =>
          current.map((item) =>
            item.id === ride.id ? { ...item, userStatus: null } : item,
          ),
        );
      } else {
        const result = await joinEvent(ride.eventId);
        const nextStatus =
          result.status === "attending" || result.status === "waiting"
            ? result.status
            : "attending";
        setRides((current) =>
          current.map((item) =>
            item.id === ride.id ? { ...item, userStatus: nextStatus } : item,
          ),
        );
      }
    } catch (err) {
      const raw =
        err instanceof Error && err.message
          ? err.message
          : t("club.rides.rsvpError");
      const isAuthError =
        /authenticat|credentials|unauthorized|not provided/i.test(raw);
      if (isAuthError) {
        setRsvpNeedsAuth(true);
        setRsvpError(null);
      } else {
        setRsvpNeedsAuth(false);
        setRsvpError(raw);
      }
    } finally {
      setRsvpBusyId(null);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p role="alert">{error}</p>
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            onClick={() => navigate("/groups")}
          >
            {t("groups.back")}
          </Button>
        </div>
      </main>
    );
  }

  if (loadingGroup || !group) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>{t("groups.loading")}</p>
      </main>
    );
  }

  const ownerName =
    [group.owner.first_name, group.owner.last_name].filter(Boolean).join(" ") ||
    group.owner.username;
  const isOwnProfile = Boolean(user && user.id === group.owner.id);
  const alreadyMember = Boolean(group.current_user_membership);
  const isPending =
    group.current_user_membership?.status === "pending";
  const isFull =
    Boolean(group.max_members) && group.member_count >= group.max_members;
  const membersLabel =
    group.max_members > 0
      ? `${group.member_count}/${group.max_members}`
      : String(group.member_count);

  return (
    <div className="club-page relative">
      <div className="absolute left-4 top-4 z-20 md:left-6 md:top-5">
        <Button
          variant="primary"
          size="sm"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={() => navigate("/groups")}
        >
          {t("groups.back")}
        </Button>
      </div>

      <ClubHero
        coverImage={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}
        name={group.name}
        description={group.description || t("groups.noDescription")}
        sportLabel={t(`sports.${group.sport}`)}
        cityLabel={group.location_name || t("groups.location")}
        showApply={!alreadyMember}
        onApply={alreadyMember || joining ? undefined : handleApply}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-8">
        {(applyNeedsAuth || applyError || applySuccess || isFull || isPending) && (
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3 text-sm">
            {applyNeedsAuth ? (
              <p role="alert" className="text-[var(--text)]">
                {t("groups.applySignInRequired")}{" "}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => navigate("/login")}
                >
                  {t("nav.login")}
                </button>
                {" · "}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => navigate("/register")}
                >
                  {t("nav.register")}
                </button>
              </p>
            ) : null}
            {applyError ? (
              <p role="alert" className="text-red-600">
                {applyError}
              </p>
            ) : null}
            {applySuccess ? (
              <p className="text-[var(--text)]">{applySuccess}</p>
            ) : null}
            {!applyNeedsAuth && !applyError && !applySuccess && isPending ? (
              <p className="text-[var(--muted)]">{t("groups.applyPending")}</p>
            ) : null}
            {!applyNeedsAuth && !applyError && !applySuccess && !isPending && isFull ? (
              <p className="text-[var(--muted)]">{t("groups.applyFull")}</p>
            ) : null}
          </div>
        )}

        <ClubStatsRow
          members={membersLabel}
          middleValue={kindLabel(group.kind, t)}
          middleLabel={t("groups.kind")}
          owner={{
            name: ownerName,
            avatarUrl: group.owner.avatar,
            to: isOwnProfile ? "/profile" : null,
          }}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <ClubUpcomingRides
              rides={rides}
              loading={loadingEvents}
              onRsvp={handleRsvp}
              title={t("groups.upcomingEvents")}
              rsvpBusyId={rsvpBusyId}
              rsvpError={rsvpError}
              rsvpNeedsAuth={rsvpNeedsAuth}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

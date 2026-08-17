import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { getGroup, getGroupEvents, joinGroup, leaveGroup } from "../api/groupsApi";
import { joinEvent, leaveEvent } from "../api/eventsApi";
import type { EventItem, GroupItem } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { ClubHero } from "../components/club/ClubHero";
import { ClubStatsRow } from "../components/club/ClubStatsRow";
import { ClubUpcomingRides } from "../components/club/ClubUpcomingRides";
import type { ClubRideItem } from "../components/club/ClubRideRow";
import Button from "../components/shared/Button";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { DEFAULT_GROUP_IMAGE_SRC } from "../utils/media";
import { GroupChat } from "../components/chat/GroupChat";
import { GroupMembersList } from "../components/groups/GroupMembersList";

function levelLabel(level: EventItem["level"], t: (key: string) => string) {
  const key = `discover.${level}` as const;
  const translated = t(key);
  return translated === key ? level : translated;
}

function eventToRide(
  event: EventItem,
  locale: string,
  t: (key: string) => string,
): ClubRideItem {
  const start = new Date(event.start_at);
  const status = event.user_status?.status;
  const attendingFromParticipants = Array.isArray(event.participants)
    ? event.participants.filter((p) => p.status === "attending").length
    : 0;
  const attendingCount =
    typeof event.attending_count === "number"
      ? event.attending_count
      : attendingFromParticipants;
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
    attendingCount,
    maxSlots: event.max_slots,
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
  const [leaving, setLeaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyNeedsAuth, setApplyNeedsAuth] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpInfo, setRsvpInfo] = useState<string | null>(null);
  const [rsvpNeedsAuth, setRsvpNeedsAuth] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const applyErrorTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (applyErrorTimer.current) window.clearTimeout(applyErrorTimer.current);
    };
  }, []);

  function showApplyError(message: string) {
    setApplyError(message);
    if (applyErrorTimer.current) window.clearTimeout(applyErrorTimer.current);
    applyErrorTimer.current = window.setTimeout(() => {
      setApplyError(null);
    }, 3500);
  }

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
    setRsvpInfo(null);
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
      showApplyError(t("groups.applyFull"));
      return;
    }

    setJoining(true);
    setApplyError(null);
    setApplyNeedsAuth(false);
    setApplySuccess(null);
    try {
      await joinGroup(groupId);
      const refreshed = await getGroup(groupId);
      setGroup(refreshed);
      setApplySuccess(t("groups.applyJoined"));
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
        showApplyError(t("groups.applyFull"));
        return;
      }
      showApplyError(raw);
    } finally {
      setJoining(false);
    }
  }

  async function handleLeaveGroup() {
    if (!groupId || leaving) return;
    setLeaveConfirmOpen(false);
    setLeaving(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      await leaveGroup(groupId);
      const refreshed = await getGroup(groupId);
      setGroup(refreshed);
      setApplySuccess(t("groups.leaveSuccess"));
    } catch (err) {
      const raw =
        err instanceof Error && err.message
          ? err.message
          : t("groups.leaveError");
      showApplyError(raw);
    } finally {
      setLeaving(false);
    }
  }

  async function handleRsvp(ride: ClubRideItem) {
    if (!ride.eventId || rsvpBusyId) return;

    if (!user) {
      setRsvpError(null);
      setRsvpInfo(null);
      setRsvpNeedsAuth(true);
      return;
    }

    const isLeaving =
      ride.userStatus === "attending" || ride.userStatus === "waiting";

    setRsvpBusyId(ride.id);
    setRsvpError(null);
    setRsvpInfo(null);
    setRsvpNeedsAuth(false);
    try {
      if (isLeaving) {
        await leaveEvent(ride.eventId);
        setRides((current) =>
          current.map((item) => {
            if (item.id !== ride.id) return item;
            const wasAttending = item.userStatus === "attending";
            return {
              ...item,
              userStatus: null,
              attendingCount: wasAttending
                ? Math.max(0, (item.attendingCount ?? 1) - 1)
                : item.attendingCount,
            };
          }),
        );
      } else {
        const result = await joinEvent(ride.eventId);
        const nextStatus =
          result.status === "attending" || result.status === "waiting"
            ? result.status
            : "attending";
        setRides((current) =>
          current.map((item) => {
            if (item.id !== ride.id) return item;
            return {
              ...item,
              userStatus: nextStatus,
              attendingCount:
                nextStatus === "attending"
                  ? (item.attendingCount ?? 0) + 1
                  : item.attendingCount,
            };
          }),
        );
        if (nextStatus === "waiting") {
          setRsvpInfo(t("club.rides.waitlistJoined"));
        }
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
        setRsvpInfo(null);
      } else {
        setRsvpNeedsAuth(false);
        setRsvpInfo(null);
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
  const isActiveMember = alreadyMember;
  const isGroupOwner =
    group.current_user_membership?.role === "owner";
  const canLeaveGroup = alreadyMember && !isGroupOwner;
  const isFull =
    Boolean(group.max_members) && group.member_count >= group.max_members;
  const membersLabel =
    group.max_members > 0
      ? `${group.member_count}/${group.max_members}`
      : `${group.member_count}/∞`;
  const groupLevels = group.levels
    .map((level) => {
      const key = `discover.${level}`;
      const translated = t(key);
      return translated === key ? level : translated;
    })
    .join(", ");

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
        showLeave={canLeaveGroup}
        applyDisabled={isFull}
        applyLabel={isFull ? t("groups.groupFull") : undefined}
        leaveLabel={leaving ? t("groups.leaving") : t("groups.leave")}
        onLeave={
          canLeaveGroup && !leaving
            ? () => setLeaveConfirmOpen(true)
            : undefined
        }
        onApply={
          alreadyMember || joining
            ? undefined
            : isFull
              ? () => showApplyError(t("groups.applyFull"))
              : handleApply
        }
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        title={t("groups.leaveConfirmTitle")}
        message={t("groups.leaveConfirm", { title: group.name })}
        confirmLabel={t("groups.leave")}
        onConfirm={handleLeaveGroup}
        onCancel={() => setLeaveConfirmOpen(false)}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-8">
        {(applyNeedsAuth || applyError || applySuccess) && (
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
          </div>
        )}

        <ClubStatsRow
          members={membersLabel}
          middleValue={groupLevels || t("groups.levels")}
          middleLabel={t("groups.levels")}
          owner={{
            name: ownerName,
            avatarUrl: group.owner.avatar,
            to: isOwnProfile ? "/profile" : `/users/${group.owner.id}`,
          }}
          onMembersClick={() => setMembersOpen((open) => !open)}
          membersExpanded={membersOpen}
          membersListId="group-members-list"
        />

        {membersOpen ? (
          <GroupMembersList
            memberships={group.memberships ?? []}
            currentUserId={user?.id}
          />
        ) : null}


        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <ClubUpcomingRides
              rides={rides}
              loading={loadingEvents}
              onRsvp={isActiveMember ? handleRsvp : undefined}
              title={t("groups.upcomingEvents")}
              headerAction={
                isGroupOwner ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/events/new?groupId=${group.id}`)}
                  >
                    {t("groups.createEvent")}
                  </Button>
                ) : undefined
              }
              rsvpBusyId={rsvpBusyId}
              rsvpError={rsvpError}
              rsvpInfo={rsvpInfo}
              rsvpNeedsAuth={rsvpNeedsAuth}
              />
          </div>
        </div>

        {isActiveMember && (
          <GroupChat groupId={group.id} groupName={group.name} />
        )}

      </div>
    </div>
  );
}

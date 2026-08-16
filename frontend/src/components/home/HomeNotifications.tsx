import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../../api/notificationsApi";
import type { NotificationItem } from "../../types/api";

const POLL_INTERVAL_MS = 30_000;

function actorLabel(notification: NotificationItem, fallback: string) {
  return notification.actor?.username || fallback;
}

function notificationMessage(
  notification: NotificationItem,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const actor = actorLabel(notification, t("notifications.someone"));
  switch (notification.type) {
    case "friend_request":
      return t("notifications.friendRequest", { actor });
    case "friend_accepted":
      return t("notifications.friendAccepted", { actor });
    case "friend_rejected":
      return t("notifications.friendRejected", { actor });
    case "friend_removed":
      return t("notifications.friendRemoved", { actor });
    case "friend_rejected":
      return t("notifications.friendRejected", { actor });
    case "friend_removed":
      return t("notifications.friendRemoved", { actor });
    case "direct_message":
      return t("notifications.directMessage", { actor });
    case "group_message":
      return t("notifications.groupMessage", { actor });
    case "group_updated":
      return t("notifications.groupUpdated", { actor });
    case "group_deleted":
      return t("notifications.groupDeleted", { actor });
    case "group_event_created":
      return t("notifications.groupEventCreated", { actor });
    case "group_event_updated":
      return t("notifications.groupEventUpdated", { actor });
    case "group_event_deleted":
      return t("notifications.groupEventDeleted", { actor });
    case "group_join_request":
      return t("notifications.groupJoinRequest", { actor });
    case "group_join_request_cancelled":
      return t("notifications.groupJoinRequestCancelled", { actor });
    case "group_member_joined":
      return t("notifications.groupMemberJoined", { actor });
    case "group_member_left":
      return t("notifications.groupMemberLeft", { actor });
    case "event_updated":
      return t("notifications.eventUpdated", { actor });
    case "event_deleted":
      return t("notifications.eventDeleted", { actor });
    case "event_participant_joined":
      return t("notifications.eventParticipantJoined", { actor });
    case "event_participant_left":
      return t("notifications.eventParticipantLeft", { actor });
    case "event_participant_promoted":
      return t("notifications.eventParticipantPromoted", { actor });
    default:
      return t("notifications.generic");
  }
}

function notificationTarget(targetUrl: string) {
  if (targetUrl.startsWith("/friends/requests")) return "/profile#friends-incoming";
  if (targetUrl === "/friends") return "/profile";
  return targetUrl || "/profile";
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function HomeNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const [countResult, unreadItems] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications(true),
      ]);
      setUnreadCount(countResult.count);
      setItems(unreadItems.slice(0, 3));
      setError("");
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("notifications.loadError"),
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load(true);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  async function openNotification(notification: NotificationItem) {
    if (!notification.read_at) {
      try {
        await markNotificationRead(notification.id);
        setUnreadCount((current) => Math.max(0, current - 1));
        setItems((current) => current.filter((item) => item.id !== notification.id));
      } catch {
        // Still navigate even if mark-read fails.
      }
    }
    navigate(notificationTarget(notification.target_url));
  }

  const isEmpty = !loading && !error && unreadCount === 0;

  if (isEmpty) {
    return (
      <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Bell size={16} className="shrink-0 opacity-70" />
        {t("home.noNotifications")}
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--text)]">
          {t("home.notificationsTitle")}
        </h2>
        {!loading && !error && unreadCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            {t("home.unreadCount", { count: unreadCount })}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-[var(--muted)]">{t("notifications.loading")}</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[var(--muted)]" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && unreadCount > 0 && (
        <ul className="space-y-2">
          {items.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-border)]/40"
                onClick={() => void openNotification(notification)}
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-semibold uppercase text-[var(--muted)]">
                  {notification.actor?.username?.slice(0, 1) || (
                    <Bell size={16} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5 text-[var(--text)]">
                    {notificationMessage(notification, t)}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {formatNotificationDate(notification.created_at)}
                  </span>
                </span>
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

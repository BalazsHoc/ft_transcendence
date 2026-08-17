import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notificationsApi";
import type { NotificationItem } from "../../types/api";
import { useAuth } from "../../features/auth/AuthContext";
import { IconButton } from "../shared/IconButton";

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

export function HeaderNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count.count);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("notifications.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [authLoading, loadNotifications, user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openNotification(notification: NotificationItem) {
    setError("");
    if (!notification.read_at) {
      try {
        const updated = await markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? updated : item)),
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (readError) {
        setError(
          readError instanceof Error
            ? readError.message
            : t("notifications.readError"),
        );
        return;
      }
    }

    setOpen(false);
    navigate(notificationTarget(notification.target_url));
  }

  async function readAll() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    setError("");
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at || now,
        })),
      );
      setUnreadCount(0);
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : t("notifications.readError"),
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const visibleNotifications = notifications.slice(0, 20);

  return (
    <div className="notifications-menu" ref={rootRef}>
      <div className="relative">
        <IconButton
          variant="outline"
          aria-label={t("nav.notifications")}
          aria-expanded={open}
          icon={<Bell size={20} />}
          onClick={() => {
            const nextOpen = !open;
            setOpen(nextOpen);
            if (nextOpen) void loadNotifications();
          }}
        />
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {open && (
        <div className="notifications-menu__list" role="menu">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              {t("notifications.title")}
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--button-text)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!unreadCount || markingAll}
              onClick={() => void readAll()}
            >
              <CheckCheck size={14} />
              {t("notifications.markAllRead")}
            </button>
          </div>

          {error && (
            <p role="alert" className="px-4 py-3 text-xs text-red-600">
              {error}
            </p>
          )}

          {loading && (
            <p className="notifications-menu__empty">
              {t("notifications.loading")}
            </p>
          )}

          {!loading && visibleNotifications.length === 0 && (
            <p className="notifications-menu__empty">
              {t("notifications.empty")}
            </p>
          )}

          {!loading && visibleNotifications.length > 0 && (
            <ul className="notifications-menu__items">
              {visibleNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`notifications-menu__item ${
                    notification.read_at ? "" : "bg-[var(--text)]/5"
                  }`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="border-0 flex w-full  items-start gap-3 bg-transparent p-0 text-left text-[var(--text)]"
                    onClick={() => void openNotification(notification)}
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--text)]/10 text-xs font-semibold uppercase">
                      {notification.actor?.username?.slice(0, 1) || <Bell size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-5">
                        {notificationMessage(notification, t)}
                      </span>
                      <span className="mt-1 block text-[11px] text-[var(--muted)]">
                        {formatNotificationDate(notification.created_at)}
                      </span>
                    </span>
                    {!notification.read_at && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-600" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

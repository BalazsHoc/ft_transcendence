import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../../api/notificationsApi";
import type { NotificationItem } from "../../types/api";

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
    case "direct_message":
      return t("notifications.directMessage", { actor });
    case "group_message":
      return t("notifications.groupMessage", { actor });
    default:
      return t("notifications.generic");
  }
}

function notificationTarget(targetUrl: string) {
  if (targetUrl.startsWith("/friends/requests")) return "/profile#friends-incoming";
  if (targetUrl === "/friends") return "/profile";
  return targetUrl || "/profile";
}

export function HomeNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [countResult, unreadItems] = await Promise.all([
          getUnreadNotificationCount(),
          getNotifications(true),
        ]);
        if (cancelled) return;
        setUnreadCount(countResult.count);
        setItems(unreadItems.slice(0, 3));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("notifications.loadError"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [t]);

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

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-[var(--text)]">
        {t("home.notificationsTitle")}
      </h2>

      {loading && (
        <p className="text-sm text-[var(--muted)]">{t("notifications.loading")}</p>
      )}

      {!loading && error && (
        <p className="text-sm text-[var(--muted)]" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && unreadCount === 0 && (
        <p className="text-sm text-[var(--muted)]">{t("home.noNotifications")}</p>
      )}

      {!loading && !error && unreadCount > 0 && (
        <>
          <p className="text-sm text-[var(--text)]">
            {t("home.unreadCount", { count: unreadCount })}
          </p>
          <ul className="divide-y divide-[var(--surface-border)] overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)]">
            {items.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-border)]"
                  onClick={() => void openNotification(notification)}
                >
                  {notificationMessage(notification, t)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

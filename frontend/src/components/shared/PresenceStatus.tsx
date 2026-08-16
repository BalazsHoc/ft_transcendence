import { useTranslation } from "react-i18next";

import { useAuth } from "../../features/auth/AuthContext";
import type { User } from "../../types/api";

type PresenceStatusProps = {
  user: User | null | undefined;
  className?: string;
};

export function PresenceStatus({ user, className = "" }: PresenceStatusProps) {
  const { t, i18n } = useTranslation();
  const { getPresence } = useAuth();
  const presence = getPresence(user);
  const lastSeenDate = presence.last_seen ? new Date(presence.last_seen) : null;
  const formattedLastSeen = lastSeenDate && !Number.isNaN(lastSeenDate.getTime())
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastSeenDate)
    : "";
  const label = presence.is_online
    ? t("presence.online")
    : formattedLastSeen
      ? t("presence.lastSeen", { time: formattedLastSeen })
      : t("presence.offline");

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-[var(--muted)] ${className}`}
      aria-label={label}
    >
      <span
        className={`h-2 w-2 rounded-full ${presence.is_online ? "bg-emerald-500" : "bg-slate-400"}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

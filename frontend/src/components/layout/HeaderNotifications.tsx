import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { IconButton } from "../shared/IconButton";

type Notification = {
  id: string;
  message: string;
};

export function HeaderNotifications() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications] = useState<Notification[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="notifications-menu" ref={rootRef}>
      <IconButton
        variant="outline"
        aria-label={t("nav.notifications")}
        aria-expanded={open}
        icon={<Bell size={20} />}
        onClick={() => setOpen((o) => !o)}
      />

      {open && (
        <div className="notifications-menu__list" role="menu">
          {notifications.length === 0 ? (
            <p className="notifications-menu__empty">
              {t("nav.noNotifications")}
            </p>
          ) : (
            <ul className="notifications-menu__items">
              {notifications.map((notification) => (
                <li key={notification.id} className="notifications-menu__item">
                  {notification.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

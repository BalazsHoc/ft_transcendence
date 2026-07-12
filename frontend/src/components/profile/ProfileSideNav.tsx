import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Compass, Map as MapIcon, CalendarCheck, MessageCircle, User, LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

const NAV_LINKS = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/discover", labelKey: "nav.discover", icon: Compass, end: false },
  { to: "/map", labelKey: "nav.map", icon: MapIcon, end: false },
  { to: "/my-events", labelKey: "nav.myEvents", icon: CalendarCheck, end: false },
  { to: "/chats", labelKey: "nav.chats", icon: MessageCircle, end: false },
  { to: "/profile", labelKey: "nav.profile", icon: User, end: false },
];

export function ProfileSideNav() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <aside className="sticky top-[88px] hidden h-[calc(100vh-88px)] w-64 shrink-0 flex-col border-r border-[var(--surface-border)] bg-[var(--surface)]/80 p-4 backdrop-blur-2xl xl:flex">
      <nav className="flex flex-1 flex-col gap-2">
        {NAV_LINKS.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }: { isActive: boolean }) =>
              [
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                isActive
                  ? "bg-[var(--text)]/5 font-bold text-[var(--text)]"
                  : "text-[var(--muted)] hover:bg-[var(--text)]/5",
              ].join(" ")
            }
          >
            <Icon size={20} />
            <span className="text-sm">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--surface-border)] pt-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[var(--muted)] transition-all hover:bg-[var(--text)]/5"
        >
          <LogOut size={20} />
          <span className="text-sm">{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}

import React from "react";
import { NavLink } from "react-router-dom";
import { Moon, Sun, Home, Compass, Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { useAuth } from "../../features/auth/AuthContext";
import Button from "../shared/Button";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";

type HeaderProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

function HeaderNavLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  const baseClasses =
    "px-3 py-2 text-sm font-medium rounded-[var(--header-radius)] transition-colors text-[var(--header-link)] hover:text-[var(--header-link-hover)] shadow-sm hover:bg-[var(--header-link-hover-bg)] active:scale-95";

  const activeClasses =
    "bg-[var(--header-link-active-bg)] text-[var(--header-link-active)]";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [baseClasses, isActive ? activeClasses : ""].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const headerClasses =
    "sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-3 bg-[var(--surface)] border-b border-[var(--surface-border)] shadow-sm";

  const navClasses = "flex items-center gap-2 flex-wrap";

  const actionsClasses = "flex items-center gap-2 flex-wrap";

  return (
    <header className={headerClasses}>
      {/* Brand */}
      <a className="font-extrabold text-[var(--text)]" href="/">
        Active Vienna
      </a>

      {/* Navigation */}
      <nav className={navClasses}>
        <HeaderNavLink to="/">
          <span className="inline-flex items-center gap-1">
            <Home size={16} />{t("nav.home")}
          </span>
        </HeaderNavLink>
        <HeaderNavLink to="/discover">
          <span className="inline-flex items-center gap-1">
            <Compass size={16} />{t("nav.discover")}
          </span>
        </HeaderNavLink>
        <HeaderNavLink to="/map">
          <span className="inline-flex items-center gap-1">
            <Map size={16} />{t("nav.map")}
          </span>
        </HeaderNavLink>
        <HeaderNavLink to="/my-events">{t("nav.myEvents")}</HeaderNavLink>
        <HeaderNavLink to="/events/new">
          {t("nav.createEvent")}
        </HeaderNavLink>
        <HeaderNavLink to="/chats">{t("nav.chats")}</HeaderNavLink>
        <HeaderNavLink to="/profile">{t("nav.profile")}</HeaderNavLink>
        <HeaderNavLink to="/ui-elements-test">UI Elements</HeaderNavLink>
        <HeaderNavLink to="/api-test">API Tester</HeaderNavLink>
      </nav>

      {/* Actions */}
      <div className={actionsClasses}>
        <LanguageSwitcher />

        {/* Dark mode toggle (Button system compliant) */}
        <Button
          variant="outline"
          iconOnly
          aria-label="Toggle dark mode"
          onClick={onToggleDarkMode}
          icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
        />

        {/* Auth section */}
        {user ? (
          <>
            {/* User identity (non-interactive display) */}
            <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text)]">
              <img
                src={resolveMediaUrl(user.avatar, DEFAULT_AVATAR_SRC)}
                alt={user.username}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span>{user.username}</span>
            </div>

            {/* Logout */}
            <Button variant="secondary" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </>
        ) : (
          <>
            <HeaderNavLink to="/login">{t("nav.login")}</HeaderNavLink>
            <HeaderNavLink to="/register">{t("nav.register")}</HeaderNavLink>
          </>
        )}
      </div>
    </header>
  );
}
import React from "react";
import { NavLink } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { useAuth } from "../../features/auth/AuthContext";
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
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors",
          "text-[var(--header-link)] hover:bg-[var(--header-link-hover-bg)]",
          isActive
            ? "bg-[var(--header-link-active-bg)] text-[var(--header-link-active)]"
            : "",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

function HeaderAction({
  onClick,
  children,
  as = "button",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  as?: "button" | "span";
}) {
  const className =
    "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors text-[var(--header-action)] hover:bg-[var(--header-action-hover-bg)]";

  if (as === "span") {
    return <span className={className}>{children}</span>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-3 bg-[var(--surface)] border-b border-[var(--surface-border)] shadow-sm">
      <a className="font-extrabold" href="/">
        Active Vienna
      </a>

      <nav className="flex items-center gap-2 flex-wrap">
        <HeaderNavLink to="/">{t("nav.home")}</HeaderNavLink>
        <HeaderNavLink to="/discover">{t("nav.discover")}</HeaderNavLink>
        <HeaderNavLink to="/map">{t("nav.map")}</HeaderNavLink>
        <HeaderNavLink to="/my-events">{t("nav.myEvents")}</HeaderNavLink>
        <HeaderNavLink to="/events/new">{t("nav.createEvent")}</HeaderNavLink>
        <HeaderNavLink to="/chats">{t("nav.chats")}</HeaderNavLink>
        <HeaderNavLink to="/profile">{t("nav.profile")}</HeaderNavLink>
        <HeaderNavLink to="/ui-elements-test">UI Elements</HeaderNavLink>
      </nav>

      <div className="flex items-center gap-2 flex-wrap">
        <LanguageSwitcher />

        <HeaderAction onClick={onToggleDarkMode}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </HeaderAction>

        {user ? (
          <>
            <HeaderAction as="span">
              <img
                src={resolveMediaUrl(user.avatar, DEFAULT_AVATAR_SRC)}
                alt={user.username}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span>{user.username}</span>
            </HeaderAction>

            <HeaderAction onClick={logout}>
              {t("nav.logout")}
            </HeaderAction>
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
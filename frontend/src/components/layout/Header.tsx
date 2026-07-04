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

type HeaderActionProps = {
  onClick?: () => void;
  children: React.ReactNode;
  as?: "button" | "span";
};

const navBase =
  "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 active:scale-95";

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
        `${navBase} header-nav-link ${isActive ? "active" : ""}`
      }
    >
      {children}
    </NavLink>
  );
}

const actionBase =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer header-action";

function HeaderAction({
  onClick,
  children,
  as = "button",
}: HeaderActionProps) {
  if (as === "span") {
    return <span className={actionBase}>{children}</span>;
  }

  return (
    <button type="button" onClick={onClick} className={actionBase}>
      {children}
    </button>
  );
}

export function Header({
  darkMode,
  onToggleDarkMode,
}: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="header flex items-center justify-between">
      <a className="logo" href="/">
        Active Vienna
      </a>

      <nav className="flex items-center gap-2 flex-wrap">
        <HeaderNavLink to="/">{t("nav.home")}</HeaderNavLink>
        <HeaderNavLink to="/discover">{t("nav.discover")}</HeaderNavLink>
        <HeaderNavLink to="/map">{t("nav.map")}</HeaderNavLink>
        <HeaderNavLink to="/my-events">{t("nav.myEvents")}</HeaderNavLink>
        <HeaderNavLink to="/events/new">
          {t("nav.createEvent")}
        </HeaderNavLink>
        <HeaderNavLink to="/chats">{t("nav.chats")}</HeaderNavLink>
        <HeaderNavLink to="/profile">{t("nav.profile")}</HeaderNavLink>
        <HeaderNavLink to="/api-test">{t("nav.apiTest")}</HeaderNavLink>
        <HeaderNavLink to="/ui-elements-test">
          UI Elements
        </HeaderNavLink>
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
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR_SRC;
                }}
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
            <HeaderNavLink to="/register">
              {t("nav.register")}
            </HeaderNavLink>
          </>
        )}
      </div>
    </header>
  );
}
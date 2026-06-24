import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { useAuth } from "../../features/auth/AuthContext";
import { DEFAULT_AVATAR_SRC } from "../../utils/media";

type HeaderProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="logo">Active Vienna</div>

      <nav className="nav">
        <NavLink to="/">{t("nav.home")}</NavLink>
        <NavLink to="/discover">{t("nav.discover")}</NavLink>
        <NavLink to="/map">{t("nav.map")}</NavLink>
        <NavLink to="/my-events">{t("nav.myEvents")}</NavLink>
        <NavLink to="/events/new">{t("nav.createEvent")}</NavLink>
        <NavLink to="/chats">{t("nav.chats")}</NavLink>
        <NavLink to="/profile">{t("nav.profile")}</NavLink>
        <NavLink to="/api-test">{t("nav.apiTest")}</NavLink>
      </nav>

      <div className="header-actions">
        <LanguageSwitcher />
        <button onClick={onToggleDarkMode} className="button secondary">
          {darkMode ? "🌙" : "☀️"}
        </button>

        {user ? (
          <>
            <span className="user-chip">
              <img
                src={user.avatar || DEFAULT_AVATAR_SRC}
                alt={user.username}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "999px",
                  objectFit: "cover",
                }}
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_AVATAR_SRC;
                }}
              />
              <span>{user.username}</span>
            </span>

            <button onClick={logout}>{t("nav.logout")}</button>
          </>
        ) : (
          <>
            <NavLink to="/login">{t("nav.login")}</NavLink>
            <NavLink to="/register">{t("nav.register")}</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
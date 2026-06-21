import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { useAuth } from "../../features/auth/AuthContext";

export function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="logo">Active Vienna</div>

      <nav className="nav">
        <NavLink to="/">{t("nav.home")}</NavLink>

        <NavLink to="/discover">{t("nav.discover")}</NavLink>

        <NavLink to="/my-events">{t("nav.myEvents")}</NavLink>

        <NavLink to="/events/new">{t("nav.createEvent")}</NavLink>

        <NavLink to="/chats">{t("nav.chats")}</NavLink>

        <NavLink to="/profile">{t("nav.profile")}</NavLink>

        <NavLink to="/api-test">{t("nav.apiTest")}</NavLink>
      </nav>

      <div className="header-actions">
        <LanguageSwitcher />

        {user ? (
          <>
            <span className="user-chip">{user.username}</span>

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

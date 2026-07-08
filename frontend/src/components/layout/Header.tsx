import React from "react";
import { NavLink } from "react-router-dom";
import {
  Moon,
  Sun,
  Home,
  Compass,
  Map,
  Bell,
  UserCircle,
  Search,
} from "lucide-react";
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
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? "text-[var(--text)] border-b-2 border-[var(--text)] pb-1 opacity-80 transition-opacity text-[18px]"
          : "text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-[18px]"
      }
    >
      {children}
    </NavLink>
  );
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [search, setSearch] = React.useState("");

  return (
    <header className="sticky top-0 w-full z-50 flex items-center justify-between gap-4 px-5 py-4 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--surface-border)] shadow-sm">
      {/* Left: brand + nav links */}
      <div className="flex items-center gap-8">
        <a
          href="/"
          className="text-xl font-bold tracking-tight text-[var(--text)]"
        >
          VIENNA ATHLETIC
        </a>

        {/* Main nav — only these 4 from the mockup */}
        <nav className="hidden md:flex items-center gap-6">
          <HeaderNavLink to="/discover">
            <span className="inline-flex items-center gap-1">
              <Compass size={16} /> {t("nav.discover")}
            </span>
          </HeaderNavLink>
          <HeaderNavLink to="/clubs">Clubs</HeaderNavLink>
          <HeaderNavLink to="/map">
            <span className="inline-flex items-center gap-1">
              <Map size={16} /> {t("nav.map")}
            </span>
          </HeaderNavLink>
          <HeaderNavLink to="/community">Community</HeaderNavLink>

          {/* Commented out — uncomment if needed:
          <HeaderNavLink to="/">
            <span className="inline-flex items-center gap-1">
              <Home size={16} />{t("nav.home")}
            </span>
          </HeaderNavLink>
          <HeaderNavLink to="/my-events">{t("nav.myEvents")}</HeaderNavLink>
          <HeaderNavLink to="/events/new">{t("nav.createEvent")}</HeaderNavLink>
          <HeaderNavLink to="/chats">{t("nav.chats")}</HeaderNavLink>
          <HeaderNavLink to="/profile">{t("nav.profile")}</HeaderNavLink>
          <HeaderNavLink to="/ui-elements-test">UI Elements</HeaderNavLink>
          */}
        </nav>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="relative hidden lg:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Search activities, clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all w-60 placeholder:text-[var(--text-muted)] text-[var(--text)]"
          />
        </div>

        {/* Join Club button */}
        <Button variant="primary">Join Club</Button>

        {/* Dark mode toggle — kept from original */}
        <Button
          variant="outline"
          iconOnly
          aria-label="Toggle dark mode"
          onClick={onToggleDarkMode}
          icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
        />

        {/* Language switcher — kept from original */}
        <LanguageSwitcher />

        {/* Bell icon */}
        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <Bell size={20} />
        </button>

        {/* Auth section — kept from original */}
        {user ? (
          <>
            <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text)]">
              <img
                src={resolveMediaUrl(user.avatar, DEFAULT_AVATAR_SRC)}
                alt={user.username}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span>{user.username}</span>
            </div>
            <Button variant="secondary" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </>
        ) : (
          <>
            {/* Commented out — uncomment if needed:
            <HeaderNavLink to="/login">{t("nav.login")}</HeaderNavLink>
            <HeaderNavLink to="/register">{t("nav.register")}</HeaderNavLink>
            */}
            <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <UserCircle size={20} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

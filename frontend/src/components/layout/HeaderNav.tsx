import React from "react";
import { NavLink } from "react-router-dom";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";

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

export function HeaderNav() {
  const { t } = useTranslation();

  return (
    <nav className="hidden md:flex items-center gap-3 lg:gap-6 shrink-0">
      <HeaderNavLink to="/discover">{t("nav.discover")}</HeaderNavLink>
        <HeaderNavLink to="/clubs">{t("nav.clubs")}</HeaderNavLink>
      <HeaderNavLink to="/map">
        <span className="inline-flex items-center gap-1">
          <Map size={16} /> {t("nav.map")}
        </span>
      </HeaderNavLink>
      <HeaderNavLink to="/community">{t("nav.community")}</HeaderNavLink>
    </nav>
  );
}

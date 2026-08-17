import React from "react";
import { NavLink } from "react-router-dom";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";

function HeaderNavLink({
  to,
  children,
  onNavigate,
  className,
}: {
  to: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  className?: string | ((props: { isActive: boolean }) => string);
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={
        className ??
        (({ isActive }: { isActive: boolean }) =>
          isActive
            ? "text-[var(--text)] border-b-2 border-[var(--text)] pb-1 opacity-80 transition-opacity text-[18px]"
            : "text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-[18px]")
      }
    >
      {children}
    </NavLink>
  );
}

type HeaderNavLinksProps = {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function HeaderNavLinks({
  onNavigate,
  variant = "desktop",
}: HeaderNavLinksProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const mobileClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "header-mobile-menu__link header-mobile-menu__link--active"
      : "header-mobile-menu__link";

  const linkClassName = variant === "mobile" ? mobileClassName : undefined;

  return (
    <>
      <HeaderNavLink to="/discover" onNavigate={onNavigate} className={linkClassName}>
        {t("nav.events")}
      </HeaderNavLink>
      <HeaderNavLink to="/groups" onNavigate={onNavigate} className={linkClassName}>
        {t("nav.groups")}
      </HeaderNavLink>
      <HeaderNavLink to="/map" onNavigate={onNavigate} className={linkClassName}>
        <span className="inline-flex items-center gap-1">
          {/* <Map size={16} /> */}
           {t("nav.map")}
        </span>
      </HeaderNavLink>
      {user && (
        <HeaderNavLink to="/chats" onNavigate={onNavigate} className={linkClassName}>
          {t("nav.messages")}
        </HeaderNavLink>
      )}
    </>
  );
}

export function HeaderNav() {
  return (
    <nav className="hidden md:flex items-center gap-5 lg:gap-6 shrink-0">
      <HeaderNavLinks />
    </nav>
  );
}

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

type HeaderNavLinkProps = {
  to: string;
  children: React.ReactNode;
  darkMode: boolean;
};

type HeaderActionProps = {
  onClick?: () => void;
  children: React.ReactNode;
  darkMode: boolean;
  as?: "button" | "span";
};

function HeaderNavLink({ to, children, darkMode }: HeaderNavLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        px-3 py-2 text-sm font-medium
        transition-colors duration-150

        ${
          darkMode
            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }

        ${
          isActive
            ? darkMode
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-gray-900"
            : ""
        }
        `
      }
    >
      {children}
    </NavLink>
  );
}

function HeaderAction({
  onClick,
  children,
  darkMode,
  as = "button",
}: HeaderActionProps) {
  const base =
    "px-30 py-2 text-sm font-medium transition-colors duration-150 flex items-center gap-2";

  const colors = darkMode
    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
    : "text-gray-300 hover:bg-gray-800 hover:text-white";

  const className = `${base} ${colors}`;

  if (as === "span") {
    return <span className={className}>{children}</span>;
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="logo">Active Vienna</div>

      {/* NAV */}
      <nav className="nav flex items-center gap-2">
        <HeaderNavLink to="/" darkMode={darkMode}>
          {t("nav.home")}
        </HeaderNavLink>

        <HeaderNavLink to="/discover" darkMode={darkMode}>
          {t("nav.discover")}
        </HeaderNavLink>

        <HeaderNavLink to="/map" darkMode={darkMode}>
          {t("nav.map")}
        </HeaderNavLink>

        <HeaderNavLink to="/my-events" darkMode={darkMode}>
          {t("nav.myEvents")}
        </HeaderNavLink>

        <HeaderNavLink to="/events/new" darkMode={darkMode}>
          {t("nav.createEvent")}
        </HeaderNavLink>

        <HeaderNavLink to="/chats" darkMode={darkMode}>
          {t("nav.chats")}
        </HeaderNavLink>

        <HeaderNavLink to="/profile" darkMode={darkMode}>
          {t("nav.profile")}
        </HeaderNavLink>

        <HeaderNavLink to="/api-test" darkMode={darkMode}>
          {t("nav.apiTest")}
        </HeaderNavLink>

        <HeaderNavLink to="/ui-elements-test" darkMode={darkMode}>
          UI Elements
        </HeaderNavLink>
      </nav>

      {/* ACTIONS */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <HeaderAction onClick={onToggleDarkMode} darkMode={darkMode}>
          {darkMode ? <Moon size={18} /> : <Sun size={18} />}
        </HeaderAction>

        {user ? (
          <>
            <HeaderAction as="span" darkMode={darkMode}>
              <img
                src={resolveMediaUrl(user.avatar, DEFAULT_AVATAR_SRC)}
                alt={user.username}
                className="w-6 h-6 rounded-full object-cover"
                onError={(event: any) => {
                  event.currentTarget.src = DEFAULT_AVATAR_SRC;
                }}
              />
              <span>{user.username}</span>
            </HeaderAction>

            <HeaderAction onClick={logout} darkMode={darkMode}>
              {t("nav.logout")}
            </HeaderAction>
          </>
        ) : (
          <>
            <HeaderNavLink to="/login" darkMode={darkMode}>
              {t("nav.login")}
            </HeaderNavLink>

            <HeaderNavLink to="/register" darkMode={darkMode}>
              {t("nav.register")}
            </HeaderNavLink>
          </>
        )}
      </div>
    </header>
  );
}
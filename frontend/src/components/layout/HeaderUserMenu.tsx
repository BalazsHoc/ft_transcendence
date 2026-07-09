import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserCircle } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { IconButton } from "../shared/IconButton";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";

export function HeaderUserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //if user is not logged in, show login button
  if (!user) {
    return (
      <IconButton
        variant="outline"
        icon={<UserCircle size={20} />}
        aria-label={t("nav.login")}
        onClick={() => navigate("/login")}
      />
    );
  }

  const links = [
    { to: "/profile", label: t("nav.profile") },
    { to: "/my-events", label: t("nav.myEvents") },
    { to: "/chats", label: t("nav.chats") },
  ];

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <img
          src={resolveMediaUrl(user.avatar, DEFAULT_AVATAR_SRC)}
          alt={user.username}
          className="h-6 w-6 rounded-full object-cover"
        />
        <span>{user.username}</span>
      </button>

      {open && (
        <ul className="user-menu__list" role="menu">
          {links.map((link) => (
            <li key={link.to} role="none">
              <Link
                role="menuitem"
                to={link.to}
                onClick={() => setOpen(false)}
                className="user-menu__option"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li role="none" className="user-menu__divider" />
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="user-menu__option"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              {t("nav.logout")}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

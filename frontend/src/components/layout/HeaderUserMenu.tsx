import { useTranslation } from "react-i18next";
import { UserCircle } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import Button from "../shared/Button";
import { IconButton } from "../shared/IconButton";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";

export function HeaderUserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <IconButton
        variant="outline"
        icon={<UserCircle size={20} />}
        aria-label={t("nav.profile")}
      />
    );
  }

  return (
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
  );
}

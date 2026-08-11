import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

export function HeaderBrand() {
  const { t } = useTranslation();
  const { user, access } = useAuth();
  const brandTo = user || access ? "/profile" : "/";

  return (
    <Link
      to={brandTo}
      className="text-xl font-bold tracking-tight text-[var(--text)]"
    >
      {t("nav.appName")}
    </Link>
  );
}

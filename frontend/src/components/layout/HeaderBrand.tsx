import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function HeaderBrand() {
  const { t } = useTranslation();

  return (
    <Link
      to="/"
      className="text-xl font-bold tracking-tight text-[var(--text)]"
      aria-label={t("nav.appName")}
    >
      <span className="md:hidden">{t("nav.appNameShort")}</span>
      <span className="hidden md:inline">{t("nav.appName")}</span>
    </Link>
  );
}

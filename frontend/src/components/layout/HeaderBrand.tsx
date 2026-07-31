import { useTranslation } from "react-i18next";

export function HeaderBrand() {
  const { t } = useTranslation();

  return (
    <a
      href="/"
      className="text-xl font-bold tracking-tight text-[var(--text)]"
    >
      {t("nav.appName")}
    </a>
  );
}

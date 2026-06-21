import { useTranslation } from "react-i18next";
import { supportedLanguages, SupportedLanguage } from "../../i18n/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <label className="language-switcher">
      <span>{t("common.language")}</span>

      <select
        value={i18n.language}
        onChange={(e) =>
          i18n.changeLanguage(e.target.value as SupportedLanguage)
        }
      >
        {supportedLanguages.map((lng) => (
          <option key={lng} value={lng}>
            {lng.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

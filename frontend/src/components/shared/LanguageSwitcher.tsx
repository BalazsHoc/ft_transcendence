import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages, SupportedLanguage } from "../../i18n/i18n";
import { IconButton } from "./IconButton";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectLanguage(lng: SupportedLanguage) {
    i18n.changeLanguage(lng);
    setOpen(false);
  }

  return (
    <div className="language-switcher" ref={rootRef}>
      <IconButton
        variant="outline"
        aria-label={t("common.language")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        icon={<span className="text-xs font-semibold">{i18n.language.toUpperCase()}</span>}
      />

      {open && (
        <ul className="language-switcher__list" role="listbox">
          {supportedLanguages.map((lng) => (
            <li key={lng}>
              <button
                type="button"
                role="option"
                aria-selected={i18n.language === lng}
                className={
                  i18n.language === lng
                    ? "language-switcher__option language-switcher__option--active"
                    : "language-switcher__option"
                }
                onClick={() => selectLanguage(lng)}
              >
                {lng.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

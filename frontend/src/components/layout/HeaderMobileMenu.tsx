import { useEffect, useRef, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { IconButton } from "../shared/IconButton";
import { HeaderNavLinks } from "./HeaderNav";

type HeaderMobileMenuProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

export function HeaderMobileMenu({
  darkMode,
  onToggleDarkMode,
}: HeaderMobileMenuProps) {
  const { t } = useTranslation();
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

  return (
    <div className="header-mobile-menu md:hidden" ref={rootRef}>
      <IconButton
        variant="outline"
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        icon={open ? <X size={18} /> : <Menu size={18} />}
      />

      {open && (
        <div className="header-mobile-menu__panel" role="menu">
          <nav className="header-mobile-menu__nav">
            <HeaderNavLinks
              variant="mobile"
              onNavigate={() => setOpen(false)}
            />
          </nav>

          <div className="header-mobile-menu__divider" />

          <button
            type="button"
            className="header-mobile-menu__action"
            onClick={onToggleDarkMode}
          >
            <span>{t("common.toggleDarkMode")}</span>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="header-mobile-menu__action">
            <span>{t("common.language")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import Button from "../shared/Button";
import { IconButton } from "../shared/IconButton";
import { HeaderBrand } from "./HeaderBrand";
import { HeaderNav } from "./HeaderNav";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderNotifications } from "./HeaderNotifications";
import { HeaderUserMenu } from "./HeaderUserMenu";

type HeaderProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [search, setSearch] = React.useState("");
  //to remove the search bar and join club button on the landing page, login page, and register page
  const isMinimalHeaderPage = ["/", "/login", "/register"].includes(pathname);

  return (
    <header className="sticky top-0 w-full z-50 flex items-center justify-between gap-4 px-5 py-4 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--surface-border)] shadow-sm">
      <div className="flex items-center gap-4 lg:gap-12 xl:gap-20 min-w-0">
        <HeaderBrand />
        <HeaderNav />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* {!isMinimalHeaderPage && <HeaderSearch value={search} onChange={setSearch} />} */}

        {!isMinimalHeaderPage && (
          <Button variant="primary" className="hidden xl:inline-flex">
            {t("nav.createEvent")}
          </Button>
        )}

        <IconButton
          variant="outline"
          aria-label={t("common.toggleDarkMode")}
          onClick={onToggleDarkMode}
          icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
        />

        <LanguageSwitcher />

        {!isMinimalHeaderPage && <HeaderNotifications />}

        <HeaderUserMenu />
      </div>
    </header>
  );
}

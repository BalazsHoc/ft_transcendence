import React from "react";
import { Moon, Sun, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import Button from "../shared/Button";
import { IconButton } from "../shared/IconButton";
import { HeaderBrand } from "./HeaderBrand";
import { HeaderNav } from "./HeaderNav";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderUserMenu } from "./HeaderUserMenu";

type HeaderProps = {
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");

  return (
    <header className="sticky top-0 w-full z-50 flex items-center justify-between gap-4 px-5 py-4 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--surface-border)] shadow-sm">
      <div className="flex items-center gap-20">
        <HeaderBrand />
        <HeaderNav />
      </div>

      <div className="flex items-center gap-3">
        <HeaderSearch value={search} onChange={setSearch} />

        <Button variant="primary">{t("nav.joinClub")}</Button>

        <IconButton
          variant="outline"
          aria-label={t("common.toggleDarkMode")}
          onClick={onToggleDarkMode}
          icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
        />

        <LanguageSwitcher />

        <IconButton
          variant="outline"
          aria-label={t("nav.notifications")}
          icon={<Bell size={20} />}
        />

        <HeaderUserMenu />
      </div>
    </header>
  );
}

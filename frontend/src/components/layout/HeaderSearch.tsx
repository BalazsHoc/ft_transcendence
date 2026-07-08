import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type HeaderSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function HeaderSearch({ value, onChange }: HeaderSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="relative hidden lg:block">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
      <input
        type="text"
        placeholder={t("nav.search")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all w-60 placeholder:text-[var(--text-muted)] text-[var(--text)]"
      />
    </div>
  );
}

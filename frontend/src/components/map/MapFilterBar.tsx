import type { ChangeEvent } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { GeoSuggestion, SportOption } from "../../types/api";
import { LocationAutocomplete } from "../geo/LocationAutocomplete";
import styles from "./MapFilterBar.module.css";

const LEVEL_OPTIONS = [
  { value: "beginner", labelKey: "discover.beginner" },
  { value: "intermediate", labelKey: "discover.intermediate" },
  { value: "advanced", labelKey: "discover.advanced" },
  { value: "all", labelKey: "discover.allLevels" },
];

type Props = {
  sport: string;
  onSportChange: (value: string) => void;
  levels: string[];
  onLevelChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  onLocationSelect: (suggestion: GeoSuggestion) => void;
  sports: SportOption[];
};

export function MapFilterBar({
  sport,
  onSportChange,
  levels,
  onLevelChange,
  time,
  onTimeChange,
  onLocationSelect,
  sports,
}: Props) {
  const { t } = useTranslation();
  const levelSummary = levels.length
    ? t("discover.levelSelected", { count: levels.length })
    : t("discover.level");

  return (
    <div className={styles.bar}>
      <div className={`${styles.search} relative`}>
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]"
        />
        <LocationAutocomplete
          label=""
          placeholder={t("map.searchPlaceholder")}
          onSelect={onLocationSelect}
        />
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
        <SlidersHorizontal size={17} aria-hidden="true" />
        <span className="hidden sm:inline">{t("discover.filters")}</span>
      </div>

      <label className="min-w-[150px] flex-1 sm:flex-none">
        <span className="sr-only">{t("discover.sport")}</span>
        <select
          value={sport}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onSportChange(event.target.value)}
        >
          <option value="">{t("discover.all")}</option>
          {sports.map((sportOption) => (
            <option key={sportOption.code} value={sportOption.code}>
              {t(`sports.${sportOption.code}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="min-w-[150px] flex-1 sm:flex-none">
        <span className="sr-only">{t("discover.time")}</span>
        <select
          value={time}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onTimeChange(event.target.value)}
        >
          <option value="">{t("discover.anytime")}</option>
          <option value="today">{t("discover.today")}</option>
          <option value="tomorrow">{t("discover.tomorrow")}</option>
          <option value="next7Days">{t("discover.next7Days")}</option>
          <option value="nextMonth">{t("discover.nextMonth")}</option>
        </select>
      </label>

      <details className="events-level-filter relative min-w-[180px] flex-1 sm:flex-none">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--control-border)] bg-[var(--control-bg)] px-3 py-[10px] text-sm text-[var(--control-text)]">
          <span className="truncate">{levelSummary}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="absolute right-0 z-30 mt-2 w-56 space-y-1 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-2 shadow-lg">
          {LEVEL_OPTIONS.map((option) => {
            const active = levels.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-border)]"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onLevelChange(option.value)}
                  className="h-4 w-4 shrink-0"
                />
                <span>{t(option.labelKey)}</span>
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
}

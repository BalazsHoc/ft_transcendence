import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import type { EventItem, SportOption } from "../../types/api";
import { EventCard } from "../events/EventCard";

type EventsSectionProps = {
  events: EventItem[];
  onCardClick: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  sport: string;
  onSportChange: (value: string) => void;
  levels: string[];
  onLevelChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  sports: SportOption[];
};

export function EventsSection({
  events,
  onCardClick,
  search,
  onSearch,
  sport,
  onSportChange,
  levels,
  onLevelChange,
  time,
  onTimeChange,
  sports,
}: EventsSectionProps) {
  const { t } = useTranslation();

  const levelOptions = [
    { value: "beginner", label: t("discover.beginner") },
    { value: "intermediate", label: t("discover.intermediate") },
    { value: "advanced", label: t("discover.advanced") },
    { value: "all", label: t("discover.allLevels") },
  ];
  const levelSummary = levels.length
    ? t("discover.levelSelected", { count: levels.length })
    : t("discover.level");

  return (
    <section className="mb-8">
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-3 shadow-sm md:p-4">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">{t("discover.searchEvents")}</span>
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="search"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearch(event.target.value)}
            placeholder={t("discover.searchEvents")}
            className="pl-10"
          />
        </label>

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
            {levelOptions.map((option) => {
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
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </details>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onCardClick(event.id)}
            className="cursor-pointer [&>article]:mb-0"
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  );
}

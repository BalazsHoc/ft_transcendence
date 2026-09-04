import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import type { EventItem, SportOption } from "../../types/api";
import { EventCard } from "../events/EventCard";

const MAX_SUGGESTIONS = 6;

/** Bold the typed part inside a suggestion so the match is visible. */
function highlightMatch(text: string, query: string) {
  const needle = query.trim();
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (!needle || index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

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
  sort: string;
  onSortChange: (value: string) => void;
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
  sort,
  onSortChange,
  sports,
}: EventsSectionProps) {
  const { t } = useTranslation();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Sports whose translated name matches what was typed. Names that *start*
  // with the query come first ("b" -> Badminton, Basketball, Boxing), then the
  // ones that merely contain it ("tennis" -> Tennis, then Table tennis).
  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    const named = sports
      .map((sportOption) => ({
        code: sportOption.code,
        label: t(`sports.${sportOption.code}`),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const startsWith = named.filter((item) =>
      item.label.toLowerCase().startsWith(query),
    );
    const contains = named.filter(
      (item) =>
        !item.label.toLowerCase().startsWith(query) &&
        item.label.toLowerCase().includes(query),
    );
    return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [search, sports, t]);

  const showSuggestions = suggestionsOpen && suggestions.length > 0;

  // Clicking anywhere outside the search box closes the list.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (searchRef.current && target && !searchRef.current.contains(target)) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function chooseSuggestion(code: string) {
    onSportChange(code);
    // The typed letters were a way to reach the sport, not a title search, so
    // leaving them in the box would keep filtering events by that text too.
    onSearch("");
    setSuggestionsOpen(false);
    setActiveIndex(0);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      return;
    }
    if (!showSuggestions) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      chooseSuggestion((suggestions[activeIndex] || suggestions[0]).code);
    }
  }

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
        <div ref={searchRef} className="relative min-w-[220px] flex-1">
          <label className="relative block">
            <span className="sr-only">{t("discover.searchEvents")}</span>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              type="search"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onSearch(event.target.value);
                setSuggestionsOpen(true);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder={t("discover.searchEvents")}
              className="pl-10"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="discover-sport-suggestions"
              aria-activedescendant={
                showSuggestions
                  ? `discover-sport-${suggestions[activeIndex]?.code}`
                  : undefined
              }
            />
          </label>

          {showSuggestions && (
            <div
              id="discover-sport-suggestions"
              role="listbox"
              aria-label={t("discover.sportSuggestions")}
              className="absolute left-0 right-0 z-30 mt-2 space-y-1 rounded-2xl bg-[var(--surface)] p-2 shadow-lg"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.code}
                  id={`discover-sport-${suggestion.code}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event: MouseEvent<HTMLButtonElement>) =>
                    event.preventDefault()
                  }
                  onClick={() => chooseSuggestion(suggestion.code)}
                  // border-0 / justify-start / an explicit background undo the
                  // global `button` rule in global.css, which would otherwise
                  // paint each row as a dark teal button.
                  className={`flex w-full cursor-pointer items-center justify-start gap-3 rounded-xl border-0 px-3 py-2 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? "bg-[var(--option-active-bg)] text-[var(--option-active-text)]"
                      : "bg-transparent text-[var(--text)]"
                  }`}
                >
                  <span className="truncate">
                    {highlightMatch(suggestion.label, search)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          <SlidersHorizontal size={17} aria-hidden="true" />
          <span className="hidden sm:inline">{t("discover.filters")}</span>
        </div>

        <label className="min-w-[150px] flex-1 sm:w-[150px] sm:flex-none">
          <span className="sr-only">{t("discover.sport")}</span>
          <select
            className="truncate"
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

        <label className="min-w-[150px] flex-1 sm:w-[150px] sm:flex-none">
          <span className="sr-only">{t("discover.time")}</span>
          <select
            className="truncate"
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

        <label className="min-w-[170px] flex-1 sm:w-[190px] sm:flex-none">
          <span className="sr-only">{t("discover.sortBy")}</span>
          <select
            className="truncate"
            value={sort}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onSortChange(event.target.value)}
          >
            <option value="">{t("discover.sortSoonest")}</option>
            <option value="az">{t("discover.sortAz")}</option>
            <option value="za">{t("discover.sortZa")}</option>
            <option value="recent">{t("discover.sortRecent")}</option>
            <option value="oldest">{t("discover.sortOldest")}</option>
          </select>
        </label>

        <details className="events-level-filter relative min-w-[180px] flex-1 sm:w-[180px] sm:flex-none">
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

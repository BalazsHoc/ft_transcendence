import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SportOption } from "../../types/api";

type SportSelectorProps = {
  title: string;
  sports: SportOption[];
  selected: string;
  onChange: (value: string) => void;
};

const DEFAULT_VISIBLE_COUNT = 3;

export function SportSelector({
  title,
  sports,
  selected,
  onChange,
}: SportSelectorProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const sportOptions = useMemo(
    () => [
      { label: t("discover.all"), value: "" },
      ...sports.map((sportOption) => ({
        label: t(`sports.${sportOption.code}`),
        value: sportOption.code,
      })),
    ],
    [sports, t],
  );

  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return sportOptions;
    return sportOptions.filter((option) =>
      option.label.toLowerCase().includes(search),
    );
  }, [query, sportOptions]);

  const visibleOptions = expanded
    ? filteredOptions
    : filteredOptions.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div className="filter-group sport-selector">
      <div className="sport-selector__header">
        <h3 className="filter-group__title">{title}</h3>
      </div>

      <div className="sport-selector__summary">
        <label className="sport-selector__summary-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onFocus={() => setExpanded(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(true);
            }}
            placeholder={t("discover.searchSports")}
          />
        </label>
        <div className="sport-selector__summary-actions">
          <button
            type="button"
            className="sport-selector__toggle"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? t("discover.collapseSports")
                : t("discover.expandSports")
            }
          >
            {expanded ? (
              <ChevronUp size={22} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={22} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="sport-selector__panel">
          <div className="sport-selector__list">
            {visibleOptions.map((option) => {
              const isActive = selected === option.value;

              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  className={`sport-selector__option ${isActive ? "sport-selector__option--active" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setExpanded(false);
                    setQuery("");
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!expanded && query ? (
        <div className="sport-selector__collapsed-results">
          <div className="sport-selector__list sport-selector__list--compact">
            {visibleOptions.map((option) => {
              const isActive = selected === option.value;

              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  className={`sport-selector__option ${isActive ? "sport-selector__option--active" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setQuery("");
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

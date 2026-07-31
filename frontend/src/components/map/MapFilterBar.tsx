import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GeoSuggestion } from "../../types/api";
import { LocationAutocomplete } from "../geo/LocationAutocomplete";
import { FilterGroup } from "../discover/FilterGroup";
import Button from "../shared/Button";
import styles from "./MapFilterBar.module.css";

const SPORT_OPTIONS = [
  { label: "All", value: "" },
  { label: "Tennis", value: "tennis" },
  { label: "Running", value: "running" },
  { label: "Cycling", value: "cycling" },
  { label: "Swimming", value: "swimming" },
  { label: "Yoga", value: "yoga" },
];

const LEVEL_OPTIONS = [
  { label: "All", value: "" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

type Props = {
  sport: string;
  onSportChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  todayOnly: boolean;
  onToggleToday: () => void;
  onLocationSelect: (suggestion: GeoSuggestion) => void;
};

export function MapFilterBar({
  sport,
  onSportChange,
  level,
  onLevelChange,
  todayOnly,
  onToggleToday,
  onLocationSelect,
}: Props) {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = (sport ? 1 : 0) + (level ? 1 : 0);

  return (
    <div className={styles.bar}>
      <div className={styles.search}>
        <LocationAutocomplete
          label=""
          placeholder={t("map.searchPlaceholder")}
          onSelect={onLocationSelect}
        />
      </div>

      <Button
        variant={todayOnly ? "primary" : "outline"}
        size="md"
        onClick={onToggleToday}
      >
        {t("map.today")}
      </Button>

      <div className={styles.filtersWrap}>
        <Button
          variant={activeFilterCount > 0 ? "primary" : "outline"}
          size="md"
          icon={<SlidersHorizontal size={16} />}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {t("map.filters")}
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>

        {filtersOpen && (
          <div className={styles.filtersPanel}>
            <FilterGroup
              title={t("discover.categories")}
              options={SPORT_OPTIONS}
              selected={sport}
              onChange={onSportChange}
              type="chips"
            />
            <FilterGroup
              title={t("discover.level")}
              options={LEVEL_OPTIONS}
              selected={level}
              onChange={onLevelChange}
              type="radio"
            />
          </div>
        )}
      </div>
    </div>
  );
}

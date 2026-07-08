import { useTranslation } from "react-i18next";
import { FilterGroup } from "../discover/FilterGroup";

type SidebarProps = {
  sport: string;
  onSportChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
};

const SPORT_OPTIONS = [
  { label: "All", value: "" },
  { label: "Tennis", value: "tennis" },
  { label: "Running", value: "running" },
  { label: "Cycling", value: "cycling" },
  { label: "Yoga", value: "yoga" },
];

const LEVEL_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const TIME_OPTIONS = [
  { label: "Anytime", value: "" },
  { label: "Morning", value: "morning" },
  { label: "Evening", value: "evening" },
];

export function Sidebar({
  sport,
  onSportChange,
  level,
  onLevelChange,
  time,
  onTimeChange,
}: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">{t("nav.discover")}</h2>
      <div className="sidebar__filters">
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
          type="checkbox"
        />
        <FilterGroup
          title={t("discover.time")}
          options={TIME_OPTIONS}
          selected={time}
          onChange={onTimeChange}
          type="radio"
        />
      </div>
    </aside>
  );
}

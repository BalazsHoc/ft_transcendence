import { useTranslation } from "react-i18next";
import { FilterGroup } from "../discover/FilterGroup";

type SidebarProps = {
  sport: string;
  onSportChange: (value: string) => void;
  level: string[];
  onLevelChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
};

export function Sidebar({
  sport,
  onSportChange,
  level,
  onLevelChange,
  time,
  onTimeChange,
}: SidebarProps) {
  const { t } = useTranslation();

  const sportOptions = [
    { label: t("discover.all"), value: "" },
    { label: t("discover.tennis"), value: "tennis" },
    { label: t("discover.running"), value: "running" },
    { label: t("discover.cycling"), value: "cycling" },
    { label: t("discover.yoga"), value: "yoga" },
  ];

  const levelOptions = [
    { label: t("discover.beginner"), value: "beginner" },
    { label: t("discover.intermediate"), value: "intermediate" },
    { label: t("discover.advanced"), value: "advanced" },
  ];

  const timeOptions = [
    { label: t("discover.anytime"), value: "" },
    { label: t("discover.morning"), value: "morning" },
    { label: t("discover.evening"), value: "evening" },
  ];

  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">{t("nav.discover")}</h2>
      <div className="sidebar__filters">
        <FilterGroup
          title={t("discover.categories")}
          options={sportOptions}
          selected={sport}
          onChange={onSportChange}
          type="chips"
        />
        <FilterGroup
          title={t("discover.level")}
          options={levelOptions}
          selected={level}
          onChange={onLevelChange}
          type="checkbox"
        />
        <FilterGroup
          title={t("discover.time")}
          options={timeOptions}
          selected={time}
          onChange={onTimeChange}
          type="radio"
        />
      </div>
    </aside>
  );
}

import { useTranslation } from "react-i18next";
import { FilterGroup } from "../discover/FilterGroup";
import type { SportOption } from "../../types/api";

type SidebarProps = {
  sport: string;
  onSportChange: (value: string) => void;
  level: string[];
  onLevelChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  sports: SportOption[];
};

export function Sidebar({
  sport,
  onSportChange,
  level,
  onLevelChange,
  time,
  onTimeChange,
  sports,
}: SidebarProps) {
  const { t } = useTranslation();

  const sportOptions = [
    { label: t("discover.all"), value: "" },
    ...sports.map((sportOption) => ({
      label: t(`sports.${sportOption.code}`),
      value: sportOption.code,
    })),
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

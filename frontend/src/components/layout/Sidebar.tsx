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
  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Discover</h2>
      <div className="sidebar__filters">
        <FilterGroup
          title="Categories"
          options={SPORT_OPTIONS}
          selected={sport}
          onChange={onSportChange}
          type="chips"
        />
        <FilterGroup
          title="Level"
          options={LEVEL_OPTIONS}
          selected={level}
          onChange={onLevelChange}
          type="checkbox"
        />
        <FilterGroup
          title="Time"
          options={TIME_OPTIONS}
          selected={time}
          onChange={onTimeChange}
          type="radio"
        />
      </div>
    </aside>
  );
}

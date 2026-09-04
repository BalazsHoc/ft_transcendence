import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { EventItem, SportOption } from "../../types/api";
import { useAuth } from "../../features/auth/AuthContext";
import Button from "../shared/Button";
import { PageHeading } from "../shared/PageHeading";
import { PaginationControls } from "../shared/PaginationControls";
import { EventsSection } from "./EventsSection";

type DiscoverMainProps = {
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
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export function DiscoverMain({
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
  page,
  pageCount,
  onPageChange,
  loading = false,
}: DiscoverMainProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="discover-main mx-auto w-full max-w-6xl space-y-8">
      <PageHeading
        icon={CalendarDays}
        title={t("discover.title")}
        description={t("discover.description")}
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate(user ? "/events/new" : "/login")}
          >
            {user ? t("nav.createEvent") : t("nav.loginToCreateEvent")}
          </Button>
        }
      />
      <EventsSection
        events={events}
        onCardClick={onCardClick}
        search={search}
        onSearch={onSearch}
        sport={sport}
        onSportChange={onSportChange}
        levels={levels}
        onLevelChange={onLevelChange}
        time={time}
        onTimeChange={onTimeChange}
        sort={sort}
        onSortChange={onSortChange}
        sports={sports}
      />
      <PaginationControls
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
        disabled={loading}
      />
      {/* <CuratedForYouSection /> */}
    </div>
  );
}

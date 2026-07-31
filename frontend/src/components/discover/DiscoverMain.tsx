import { EventItem } from "../../types/api";
import { CuratedForYouSection } from "./CuratedForYouSection";
import { HappeningNowSection } from "./HappeningNowSection";

type DiscoverMainProps = {
  events: EventItem[];
  onCardClick: (id: string) => void;
};

export function DiscoverMain({ events, onCardClick }: DiscoverMainProps) {
  return (
    <div className="discover-main">
      <HappeningNowSection events={events} onCardClick={onCardClick} />
      <CuratedForYouSection />
    </div>
  );
}

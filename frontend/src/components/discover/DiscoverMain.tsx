import { EventItem } from "../../types/api";
import { CuratedForYouSection } from "./CuratedForYouSection";
import { EventsSection } from "./EventsSection";

type DiscoverMainProps = {
  events: EventItem[];
  onCardClick: (id: string) => void;
};

export function DiscoverMain({ events, onCardClick }: DiscoverMainProps) {
  return (
    <div className="discover-main">
      <EventsSection events={events} onCardClick={onCardClick} />
      {/* <CuratedForYouSection /> */}
    </div>
  );
}
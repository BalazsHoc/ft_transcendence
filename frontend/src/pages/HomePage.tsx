import { HomeGreeting } from "../components/home/HomeGreeting";
import { HomeNotifications } from "../components/home/HomeNotifications";
import { HomeUpcomingEvents } from "../components/home/HomeUpcomingEvents";
import { HomeMyGroups } from "../components/home/HomeMyGroups";

export function HomePage() {
  return (
    /* home-page: wrapper class for this page */
    <div className="home-page">
      <HomeGreeting />
      {/*
        mx-auto     = center the block horizontally
        max-w-6xl   = limit width so the page is not too wide
        space-y-6   = vertical gap between sections
        px-4 py-8   = horizontal + vertical padding
        md:space-y-8 md:py-10 = more gap/padding from medium screens up (responsive)
      */}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:space-y-8 md:py-10">
        <HomeNotifications />
        <HomeUpcomingEvents />
        <HomeMyGroups />
      </div>
    </div>
  );
}

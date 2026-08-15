import { HomeGreeting } from "../components/home/HomeGreeting";
import { HomeNotifications } from "../components/home/HomeNotifications";
import { HomeUpcomingEvents } from "../components/home/HomeUpcomingEvents";
import { HomeMyGroups } from "../components/home/HomeMyGroups";
import { HomeQuickLinks } from "../components/home/HomeQuickLinks";

export function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
      <HomeGreeting />
      <HomeNotifications />
      <HomeUpcomingEvents />
      <HomeMyGroups />
      <HomeQuickLinks />
    </main>
  );
}

import { HomeGreeting } from "../components/home/HomeGreeting";
import { HomeNotifications } from "../components/home/HomeNotifications";
import { HomeUpcomingEvents } from "../components/home/HomeUpcomingEvents";
import { HomeMyGroups } from "../components/home/HomeMyGroups";

export function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:space-y-8 md:py-10">
      <HomeGreeting />
      <HomeNotifications />
      <HomeUpcomingEvents />
      <HomeMyGroups />
    </main>
  );
}

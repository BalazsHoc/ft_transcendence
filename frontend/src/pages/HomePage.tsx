import { HomeGreeting } from "../components/home/HomeGreeting";
import { HomeNotifications } from "../components/home/HomeNotifications";

export function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
      <HomeGreeting />
      <HomeNotifications />
    </main>
  );
}

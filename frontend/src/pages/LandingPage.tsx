import { useAuth } from "../features/auth/AuthContext";
import { WelcomeHero } from "../components/landing/WelcomeHero";
import { CuratedExperiences } from "../components/landing/CuratedExperiences";
import { HomePage } from "./HomePage";

export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <HomePage />;
  }

  return (
    <div className="landing-page">
      <WelcomeHero />
      <CuratedExperiences />
    </div>
  );
}

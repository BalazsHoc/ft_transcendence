import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { WelcomeHero } from "../components/landing/WelcomeHero";
import { CuratedExperiences } from "../components/landing/CuratedExperiences";

export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="landing-page">
      <WelcomeHero />
      <CuratedExperiences />
    </div>
  );
}
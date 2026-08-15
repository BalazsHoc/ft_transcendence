import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { WelcomeHero } from "../landing/WelcomeHero";

export function HomeGreeting() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = user?.first_name || user?.username || t("profile.guest");

  return (
    <WelcomeHero
      compact
      showActions={false}
      title={t("home.greeting", { name })}
      subtitle={t("home.subtitle")}
    />
  );
}

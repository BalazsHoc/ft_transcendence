import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";

export function HomeGreeting() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = user?.first_name || user?.username || t("profile.guest");

  return (
    <header className="space-y-2 pb-2">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
        {t("home.greeting", { name })}
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
        {t("home.subtitle")}
      </p>
    </header>
  );
}

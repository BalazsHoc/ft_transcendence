import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";

export function HomeGreeting() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = user?.username || t("profile.guest");

  return (
    <header className="space-y-1 border-b border-[var(--surface-border)] pb-6">
      <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
        {t("home.greeting", { name })}
      </h1>
      <p className="max-w-xl text-sm text-[var(--muted)] md:text-base">
        {t("home.subtitle")}
      </p>
    </header>
  );
}

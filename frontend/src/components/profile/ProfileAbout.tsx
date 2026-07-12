import { useTranslation } from "react-i18next";
import { User } from "../../types/api";

type ProfileAboutProps = {
  user: User | null;
};

export function ProfileAbout({ user }: ProfileAboutProps) {
  const { t } = useTranslation();
  const languages = user?.languages?.length ? user.languages.join(", ") : t("profile.notSet");
  const focusAreas = user?.interests?.length ? user.interests.join(", ") : t("profile.notSet");

  return (
    <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">{t("profile.about")}</h3>

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {t("profile.languages")}
          </h4>
          <p className="text-sm text-[var(--text)]">{languages}</p>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {t("profile.focusAreas")}
          </h4>
          <p className="text-sm text-[var(--text)]">{focusAreas}</p>
        </div>
      </div>
    </div>
  );
}

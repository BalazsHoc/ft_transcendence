import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";

type ClubRecruitingCardProps = {
  onApply?: () => void;
};

export function ClubRecruitingCard({ onApply }: ClubRecruitingCardProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--text)]">
        <Megaphone size={20} aria-hidden="true" />
      </div>
      <h2 className="font-display text-lg font-semibold text-[var(--text)]">
        {t("club.recruiting.title")}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t("club.recruiting.description")}
      </p>
      <Button variant="primary" className="mt-5 w-full" onClick={onApply}>
        {t("club.recruiting.apply")}
      </Button>
    </section>
  );
}

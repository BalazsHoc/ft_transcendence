import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sections = t("privacyPolicy.sections", { returnObjects: true }) as PolicySection[];

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)]"
      >
        <ArrowLeft size={16} />
        {t("privacyPolicy.back")}
      </button>

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted)]">ft_transcendence</p>
        <h1 className="font-display text-4xl font-bold text-[var(--text)]">{t("privacyPolicy.title")}</h1>
      </header>

      <section className="space-y-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-sm">
        <p className="text-sm text-[var(--muted)]">{t("privacyPolicy.lastUpdated")}</p>
        {sections.map((section) => (
          <div className="space-y-3" key={section.title}>
            <h2 className="font-display text-2xl font-bold">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul className="list-disc space-y-1 pl-6">
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </section>
    </section>
  );
}

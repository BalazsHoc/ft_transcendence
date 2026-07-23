import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BentoImageCard } from "./BentoImageCard";
import { BentoInfoCard } from "./BentoInfoCard";

export function CuratedExperiences() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goToDiscover = () => navigate("/discover");

  return (
    <section
      id="curated-experiences"
      className="scroll-mt-24 bg-[var(--bg)] py-20"
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-10 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
            {t("landing.curated.title")}
          </h2>
          <p className="text-lg text-[var(--muted)]">
            {t("landing.curated.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:auto-rows-[300px]">
          <BentoImageCard
            size="lg"
            className="md:col-span-2 md:row-span-2"
            image="/tennis.jpg"
            tag={t("landing.curated.cards.tennis.tag")}
            title={t("landing.curated.cards.tennis.title")}
            description={t("landing.curated.cards.tennis.description")}
            onClick={goToDiscover}
          />

          <BentoInfoCard
            image="/vienna-river-run.jpeg"
            tag={t("landing.curated.cards.running.tag")}
            title={t("landing.curated.cards.running.title")}
            description={t("landing.curated.cards.running.description")}
            attendingLabel={t("landing.curated.attending")}
            onClick={goToDiscover}
          />

          <BentoImageCard
            size="sm"
            image="/cycling.jpeg"
            title={t("landing.curated.cards.cycling.title")}
            onClick={goToDiscover}
          />
        </div>
      </div>
    </section>
  );
}

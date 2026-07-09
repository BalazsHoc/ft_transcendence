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
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuCqCTFWzGBB_HNE3c2owEFxoqVqY_5sSx_urWQNpL2YpsUv0hwAbIpcByOkxYszHrr_P8tPD3z2fKu-NjCZMZERlXDULqRebDz8Nt80FIDMzLguVoUf7dv1aYqAKCO7KN-fglDCM4ircsvWcYNF7TgfUosdjyUyZOwaUwhgP5WWs62GTbsjYVXNWLmyMwExAx1gEUOIs8ZEIuIX-b5OnATeskJbVMbLs1J62Sskqlv7s381ARfr2hiBXosEV9r4BGkKNhFee0RssAw"
            tag={t("landing.curated.cards.tennis.tag")}
            title={t("landing.curated.cards.tennis.title")}
            description={t("landing.curated.cards.tennis.description")}
            onClick={goToDiscover}
          />

          <BentoInfoCard
            tag={t("landing.curated.cards.running.tag")}
            title={t("landing.curated.cards.running.title")}
            description={t("landing.curated.cards.running.description")}
            attendingLabel={t("landing.curated.attending")}
            onClick={goToDiscover}
          />

          <BentoImageCard
            size="sm"
            image="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg"
            title={t("landing.curated.cards.cycling.title")}
            onClick={goToDiscover}
          />
        </div>
      </div>
    </section>
  );
}

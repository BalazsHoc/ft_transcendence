import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "../shared/Button";
import { VIENNA_SKYLINE_IMAGE } from "../shared/backgroundImages";

type WelcomeHeroProps = {
  title?: string;
  subtitle?: string;
  showActions?: boolean;
  compact?: boolean;
};

export function WelcomeHero({
  title,
  subtitle,
  showActions = true,
  compact = false,
}: WelcomeHeroProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const heading = title ?? t("landing.hero.title");
  const text = subtitle ?? t("landing.hero.subtitle");

  function scrollToCurated() {
    document
      .getElementById("curated-experiences")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden ${
        compact ? "min-h-[52vh] sm:min-h-[58vh]" : "min-h-[85vh]"
      }`}
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${VIENNA_SKYLINE_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-[var(--bg)]/30 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <h1
          className={`mb-6 font-display font-bold tracking-tight text-[var(--text)] ${
            compact
              ? "text-4xl sm:text-5xl md:text-6xl"
              : "text-4xl sm:text-6xl md:text-7xl"
          }`}
        >
          {heading}
        </h1>
        <p
          className={`mx-auto max-w-2xl text-[var(--muted)] ${
            showActions ? "mb-10 text-lg" : "mb-0 text-base sm:text-lg"
          }`}
        >
          {text}
        </p>
        {showActions && (
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate("/discover")}
            >
              {t("landing.hero.ctaExplore")}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={scrollToCurated}
            >
              {t("landing.hero.ctaLearnMore")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

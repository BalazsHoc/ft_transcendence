import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "../shared/Button";

export function WelcomeHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function scrollToCurated() {
    document
      .getElementById("curated-experiences")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOXWmfEumbEvOGRGNU7AdhHe6nQe0AG4ljK7eOfAA7VTvd_Fet511r8w-5q2bRldOVFzVgx8j1UjYPxkYBfZxha384H_RvHkDnr-pPC-DO-QALBsvAmsxSor4LVgnfkE-jDuTq5TGVEqNuMNmTMMwh4VU25z_vRXBoLGwPcjUVPLo98sZ07RUfH8W53VZBxjXaF8Jv4S9FqPsVOE22yUE3-zkklL7UUcom-SR_WxkJLiaox1ayRGxR2uUDMXy_Y1UvOyfLqzLs6NA')",
          }}
        />
        <div className="absolute inset-0 bg-[var(--bg)]/30 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-[var(--text)] sm:text-6xl md:text-7xl">
          {t("landing.hero.title")}
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--muted)]">
          {t("landing.hero.subtitle")}
        </p>
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
      </div>
    </section>
  );
}

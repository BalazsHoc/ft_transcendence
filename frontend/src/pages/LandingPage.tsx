import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function LandingPage() {
  const { t } = useTranslation();
  const [activeButton, setActiveButton] = useState<string | null>(null);

  return (
    <section className="hero">
      <h1>{t("landing.title")}</h1>
      <p>{t("landing.subtitle")}</p>

      <div className="row">
        <Link
          className={`button ${activeButton === "discover" ? "active" : ""}`}
          to="/discover"
          onClick={() => setActiveButton("discover")}
        >
          {t("landing.ctaDiscover")}
        </Link>

        <Link
          className={`button secondary ${activeButton === "create" ? "active" : ""}`}
          to="/events/new"
          onClick={() => setActiveButton("create")}
        >
          {t("landing.ctaCreate")}
        </Link>
      </div>
    </section>
  );
}
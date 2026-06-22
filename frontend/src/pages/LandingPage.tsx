import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
export function LandingPage() {
  const { t } = useTranslation();
  return (
  <section className="hero">
    <h1>{t("landing.title")}</h1>
    <p>{t("landing.subtitle")}</p>
    <div className="row">
      <Link className="button" to="/discover">
        {t("landing.ctaDiscover")}
      </Link>
      <Link className="button secondary" to="/events/new">
        {t("landing.ctaCreate")}
      </Link>
    </div>
  </section>
  );
}

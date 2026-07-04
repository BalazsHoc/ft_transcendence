import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "../components/shared/Button";

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="hero">
      <h1>{t("landing.title")}</h1>
      <p>{t("landing.subtitle")}</p>

      <div className="row">
        <Button
          variant="primary"
          onClick={() => navigate("/discover")}
        >
          {t("landing.ctaDiscover")}
        </Button>

        <Button
          size="sm"
          variant="primary"
          onClick={() => navigate("/events/new")}
        >
          {t("landing.ctaCreate")}
        </Button>
      </div>
    </section>
  );
}
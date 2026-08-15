import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";

export function HomeQuickLinks() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text)]">
        {t("home.quickLinks")}
      </h2>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate("/discover")}
        >
          {t("home.linkEvents")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/groups")}
        >
          {t("home.linkGroups")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/map")}
        >
          {t("home.linkMap")}
        </Button>
      </div>
    </section>
  );
}

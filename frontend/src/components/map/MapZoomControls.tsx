import { LocateFixed, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../shared/IconButton";
import styles from "./MapZoomControls.module.css";
import Button from "../test_ui/TestButton";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  locating?: boolean;
};

export function MapZoomControls({ onZoomIn, onZoomOut, onLocate, locating }: Props) {
  const { t } = useTranslation();

  return (
    <div className={styles.controls}>
      <div className={styles.zoomGroup}>
        <IconButton
          variant="outline"
          aria-label={t("map.zoomIn")}
          icon={<Plus size={18} />}
          onClick={onZoomIn}
          className={styles.zoomButton}
        />
        <div className={styles.divider} />
        <IconButton
          variant="outline"
          aria-label={t("map.zoomOut")}
          icon={<Minus size={18} />}
          onClick={onZoomOut}
          className={styles.zoomButton}
        />
      </div>

      <IconButton
        variant="outline"
        aria-label={t("map.locateMe")}
        icon={<LocateFixed size={18} />}
        onClick={onLocate}
        disabled={locating}
        className={styles.locateButton}
        />
        {t("map.locateMe")}
    </div>
  );
}

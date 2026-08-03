import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../shared/Badge";
import Button from "../shared/Button";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type ClubHeroProps = {
  coverImage?: string;
  name: string;
  description: string;
  sportLabel: string;
  cityLabel: string;
  onApply?: () => void;
  onViewSchedule?: () => void;
  showApply?: boolean;
};

export function ClubHero({
  coverImage,
  name,
  description,
  sportLabel,
  cityLabel,
  onApply,
  onViewSchedule,
  showApply = true,
}: ClubHeroProps) {
  const { t } = useTranslation();
  const imageUrl = resolveMediaUrl(coverImage, DEFAULT_EVENT_IMAGE_SRC);

  return (
    <div>
      <div className="relative h-[240px] w-full overflow-hidden rounded-b-3xl bg-[var(--surface-border)] md:h-[280px]">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/45 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-16 flex max-w-6xl flex-col gap-6 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl md:-mt-20 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>{sportLabel}</Badge>
            <Badge variant="solid">{cityLabel}</Badge>
          </div>

          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {name}
          </h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin size={16} aria-hidden="true" />
            {cityLabel}
          </p>

          <p className="mt-4 max-w-2xl text-sm text-[var(--muted)] md:text-base">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          {showApply ? (
            <Button variant="primary" onClick={onApply}>
              {t("club.hero.applyToJoin")}
            </Button>
          ) : null}
          {onViewSchedule ? (
            <Button variant="outline" onClick={onViewSchedule}>
              {t("club.hero.viewSchedule")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

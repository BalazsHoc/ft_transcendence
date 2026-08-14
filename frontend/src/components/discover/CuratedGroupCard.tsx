import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { KeyboardEvent } from "react";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";
import {
  DEFAULT_GROUP_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

/** Format backend ISO date as `20 Jul 2026`. */
export function formatCardDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

type CuratedGroupCardProps = {
  variant?: "featured" | "compact";
  image: string;
  title: string;
  description?: string;
  categoryLabel: string;
  levelLabel?: string;
  memberCount?: number;
  timeLabel?: string;
  dateAt?: string | null;
  detailsTo?: string;
  className?: string;
};

export function CuratedGroupCard({
  variant = "featured",
  image,
  title,
  description,
  categoryLabel,
  levelLabel,
  memberCount,
  timeLabel,
  dateAt,
  detailsTo,
  className = "",
}: CuratedGroupCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const imageUrl = resolveMediaUrl(image, DEFAULT_GROUP_IMAGE_SRC);
  const dateLabel = formatCardDate(dateAt);

  if (variant === "compact") {
    return (
      <article
        className={`relative min-h-[300px] cursor-pointer overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
        onClick={detailsTo ? () => navigate(detailsTo) : undefined}
        onKeyDown={
          detailsTo
            ? (event: KeyboardEvent<HTMLElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(detailsTo);
                }
              }
            : undefined
        }
        role={detailsTo ? "link" : undefined}
        tabIndex={detailsTo ? 0 : undefined}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />

        <div className="absolute inset-0 bg-black/20" />

        {/* <div className="absolute inset-x-0 bottom-0 rounded-xl border border-white/5 bg-transparent p-3 backdrop-blur-[6px]"> */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black px-5 py-5">
          <Badge className="mb-2">{categoryLabel}</Badge>

          <h3 className="font-display text-lg font-semibold text-white">
            {title}
          </h3>

          {typeof memberCount === "number" ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/80">
              <Users size={14} aria-hidden="true" />
              <span>{t("discover.members", { count: memberCount })}</span>
            </p>
          ) : dateLabel ? (
            <p className="mt-1 text-sm text-white/80">{dateLabel}</p>
          ) : timeLabel ? (
            <p className="mt-1 text-sm text-white/80">{timeLabel}</p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative min-h-[320px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black px-5 py-5">
      {/* <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/[0.02] p-5 backdrop-blur-[5px]"> */}
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge>{categoryLabel}</Badge>
          {levelLabel ? <Badge>{levelLabel}</Badge> : null}
        </div>

        <h3 className="mb-1 font-display text-2xl font-semibold text-white">
          {title}
        </h3>

        {description ? (
          <p className="mb-3 text-sm text-white/80">{description}</p>
        ) : null}

        {dateLabel ? (
          <p className="mb-3 text-sm text-white/75">{dateLabel}</p>
        ) : timeLabel ? (
          <p className="mb-3 text-sm text-white/75">{timeLabel}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-white/90">
            {typeof memberCount === "number" ? (
              <>
                <Users size={18} aria-hidden="true" />
                <span>{t("discover.members", { count: memberCount })}</span>
              </>
            ) : null}
          </div>

          {detailsTo ? (
            <Button variant="primary" onClick={() => navigate(detailsTo)}>
              {t("groups.details")}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

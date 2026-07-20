import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type FeaturedEventCardProps = {
  image: string;
  title: string;
  description: string;
  levelLabel: string;
  memberCount: number;
  onJoin?: () => void;
  className?: string;
};

export function FeaturedEventCard({
  image,
  title,
  description,
  levelLabel,
  memberCount,
  onJoin,
  className = "",
}: FeaturedEventCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC);

  return (
    <article
      className={`relative min-h-[320px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/10 p-8 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{t("discover.featuredClub")}</Badge>
          <Badge>{levelLabel}</Badge>
        </div>

        <h3 className="mb-2 font-display text-2xl font-semibold text-white">
          {title}
        </h3>

        <p className="mb-6 text-sm text-white/80">{description}</p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="secondary" onClick={onJoin}>
            {t("discover.joinGroup")}
          </Button>

          <div className="flex items-center gap-2 text-sm text-white/90">
            <Users size={18} aria-hidden="true" />
            <span>{t("discover.members", { count: memberCount })}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

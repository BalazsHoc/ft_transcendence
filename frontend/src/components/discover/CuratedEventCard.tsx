import { Badge } from "../shared/Badge";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type CuratedEventCardProps = {
  image: string;
  title: string;
  categoryLabel: string;
  timeLabel: string;
  className?: string;
};

export function CuratedEventCard({
  image,
  title,
  categoryLabel,
  timeLabel,
  className = "",
}: CuratedEventCardProps) {
  const imageUrl = resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC);

  return (
    <article
      className={`relative min-h-[200px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
        <Badge className="mb-3">{categoryLabel}</Badge>

        <h3 className="font-display text-lg font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm text-white/80">{timeLabel}</p>
      </div>
    </article>
  );
}

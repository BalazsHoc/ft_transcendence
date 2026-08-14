import * as React from "react";
import { MapPin } from "lucide-react";

import { Badge } from "../shared/Badge";
import {
  getDefaultEventImage,
  resolveMediaUrl,
} from "../../utils/media";
import { joinEvent } from "../../api/eventsApi";

interface LiveEventCardProps {
  image?: string | null;
  status: string;

  sport: string;
  title: string;
  location: string;
  onClick?: () => void;
}

export function LiveEventCard({
  image,
  status,
  sport,
  title,
  location,
  onClick,
}: LiveEventCardProps) {
  const fallbackImage = getDefaultEventImage(sport);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] shadow-md transition-shadow duration-300 hover:shadow-lg"
      onClick={onClick}
      // onKeyDown={handleKeyDown}
    >
      <div className="relative">
        <img
          className="h-48 w-full object-cover"
          src={resolveMediaUrl(image, fallbackImage)}
          alt={title}
          onError={(e: { currentTarget: HTMLImageElement }) => {
            const target = e.currentTarget;
            target.src = fallbackImage;
          }}
        />

        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="live">
            {status}
          </Badge>

          <Badge variant="green">
            implement ? attending : not joined ?
          </Badge>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {title}
          </h3>

          <Badge
            variant="solid"
            className="!rounded-[var(--radius-button)] px-3.5 py-2"
          >
            {sport}
          </Badge>
        </div>

        <p className="flex items-center gap-1 text-sm text-[var(--muted)]">
          <MapPin size={15} />
          <span>{location}</span>
        </p>
      </div>
    </article>
  );
}

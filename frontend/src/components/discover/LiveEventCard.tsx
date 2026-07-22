import * as React from "react";

import { Badge } from "../shared/Badge";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";

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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] shadow-md transition-shadow duration-300 hover:shadow-lg"
      onClick={onClick}
      // onKeyDown={handleKeyDown}
    >
      <div className="relative">
        <img
          className="h-48 w-full object-cover"
          src={resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC)}
          alt={title}
          onError={(e: { currentTarget: HTMLImageElement }) => {
            const target = e.currentTarget;
            target.src = DEFAULT_EVENT_IMAGE_SRC;
          }}
        />

        <Badge
          variant="live"
          className="absolute left-3 top-3"
        >
          {status}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {title}
          </h3>

          <Badge variant="solid">{sport}</Badge>
        </div>

        <p className="text-sm text-[var(--muted)]">
          📍{location}
        </p>
      </div>
    </article>
  );
}
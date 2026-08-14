import { API_URL } from "../api/client";

export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";
export const DEFAULT_EVENT_IMAGE_SRC = "/default-events/football.webp";
export const DEFAULT_GROUP_IMAGE_SRC = "/default-group-image.png";

const EVENT_IMAGE_BY_SPORT: Record<string, string> = {
  badminton: "/default-events/badminton.webp",
  basketball: "/default-events/basketball.webp",
  boxing: "/default-events/boxing.webp",
  chess: "/default-events/chess.webp",
  climbing: "/default-events/climbing.webp",
  cycling: "/default-events/cycling.webp",
  dance: "/default-events/dance.webp",
  football: "/default-events/football.webp",
  hiking: "/default-events/hiking.webp",
  martial_arts: "/default-events/martial_arts.webp",
  rowing: "/default-events/rowing.webp",
  running: "/default-events/running.webp",
  skiing: "/default-events/skiing.webp",
  snowboarding: "/default-events/snowboarding.webp",
  strength: "/default-events/strength.webp",
  swimming: "/default-events/swimming.webp",
  table_tennis: "/default-events/table_tennis.webp",
  tennis: "/default-events/tennis.webp",
  volleyball: "/default-events/volleyball.webp",
  yoga: "/default-events/yoga.webp",
};

export function getDefaultEventImage(sport?: string | null) {
  if (!sport) return DEFAULT_EVENT_IMAGE_SRC;
  return EVENT_IMAGE_BY_SPORT[sport.toLowerCase()] ?? DEFAULT_EVENT_IMAGE_SRC;
}

export function resolveMediaUrl(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) return fallback;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("blob:") || value.startsWith("data:")) return value;
  if (value.startsWith("/media/")) return `${API_URL}${value}`;
  return value;
}

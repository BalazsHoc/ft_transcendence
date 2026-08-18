import { API_URL } from "../api/client";

export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";
export const DEFAULT_EVENT_IMAGE_SRC = "/defaultsEvents/football.png";
export const DEFAULT_GROUP_IMAGE_SRC = "/defaultGroups/football.png";

const EVENT_IMAGE_BY_SPORT: Record<string, string> = {
  badminton: "/defaultsEvents/badminton.png",
  basketball: "/defaultsEvents/basketball.png",
  boxing: "/defaultsEvents/boxing.png",
  chess: "/defaultsEvents/chess.png",
  climbing: "/defaultsEvents/climbing.png",
  cycling: "/defaultsEvents/cycling.png",
  dance: "/defaultsEvents/dance.png",
  football: "/defaultsEvents/football.png",
  hiking: "/defaultsEvents/hiking.png",
  martial_arts: "/defaultsEvents/martial_arts.png",
  rowing: "/defaultsEvents/rowing.png",
  running: "/defaultsEvents/running.png",
  skiing: "/defaultsEvents/skiing.png",
  snowboarding: "/defaultsEvents/snowboarding.png",
  strength: "/defaultsEvents/strength.png",
  swimming: "/defaultsEvents/swimming.png",
  table_tennis: "/defaultsEvents/table_tennis.png",
  tennis: "/defaultsEvents/tennis.png",
  volleyball: "/defaultsEvents/volleyball.png",
  yoga: "/defaultsEvents/yoga.png",
};

const GROUP_IMAGE_BY_SPORT: Record<string, string> = {
  badminton: "/defaultGroups/badminton.png",
  basketball: "/defaultGroups/basketball.png",
  boxing: "/defaultGroups/boxing.png",
  chess: "/defaultGroups/chess.png",
  climbing: "/defaultGroups/climbing.png",
  cycling: "/defaultGroups/cycling.png",
  dance: "/defaultGroups/dance.png",
  football: "/defaultGroups/football.png",
  hiking: "/defaultGroups/hiking.png",
  martial_arts: "/defaultGroups/martial_arts.png",
  rowing: "/defaultGroups/rowing.png",
  running: "/defaultGroups/running.png",
  skiing: "/defaultGroups/skiing.png",
  snowboarding: "/defaultGroups/snowboarding.png",
  strength: "/defaultGroups/strength.png",
  swimming: "/defaultGroups/swimming.png",
  table_tennis: "/defaultGroups/table_tennis.png",
  tennis: "/defaultGroups/tennis.png",
  volleyball: "/defaultGroups/volleyball.png",
  yoga: "/defaultGroups/yoga.png",
};

export function getDefaultEventImage(sport?: string | null) {
  if (!sport) return DEFAULT_EVENT_IMAGE_SRC;
  return EVENT_IMAGE_BY_SPORT[sport.toLowerCase()] ?? DEFAULT_EVENT_IMAGE_SRC;
}

export function getDefaultGroupImage(sport?: string | null) {
  if (!sport) return DEFAULT_GROUP_IMAGE_SRC;
  return GROUP_IMAGE_BY_SPORT[sport.toLowerCase()] ?? DEFAULT_GROUP_IMAGE_SRC;
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

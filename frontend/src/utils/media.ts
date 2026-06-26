import { API_URL } from "../api/client";

export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";
export const DEFAULT_EVENT_IMAGE_SRC = "/default-event-image.svg";

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

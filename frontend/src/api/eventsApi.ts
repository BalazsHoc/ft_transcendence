import { apiRequest } from "./client";
import { EventItem, MessageItem } from "../types/api";
export type EventPayload = {
  title: string;
  description: string;
  sport: string;
  level: string;
  languages: string[];
  location_name: string;
  location_address: string;
  latitude: number;
  longitude: number;
  start_at: string;
  end_at: string;
  max_slots: number;
};
export function getEvents(params?: {
  sport?: string;
  level?: string;
  language?: string;
}) {
  const q = new URLSearchParams();
  if (params?.sport) q.set("sport", params.sport);
  if (params?.level) q.set("level", params.level);
  if (params?.language) q.set("language", params.language);
  return apiRequest<EventItem[]>(
    `/api/events/${q.toString() ? `?${q.toString()}` : ""}`,
  );
}
export function getEvent(id: string) {
  return apiRequest<EventItem>(`/api/events/${id}/`);
}
export function createEvent(payload: EventPayload) {
  return apiRequest<EventItem>("/api/events/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function updateEvent(id: string, payload: Partial<EventPayload>) {
  return apiRequest<EventItem>(`/api/events/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
export function deleteEvent(id: string) {
  return apiRequest<void>(`/api/events/${id}/`, { method: "DELETE" });
}
export function joinEvent(id: string) {
  return apiRequest<{
    success: boolean;
    status: string;
    queue_position: number;
  }>(`/api/events/${id}/join/`, { method: "POST" });
}
export function leaveEvent(id: string) {
  return apiRequest<{ success: boolean; promoted_user_id: string | null }>(
    `/api/events/${id}/leave/`,
    { method: "POST" },
  );
}
export function getEventMessages(id: string) {
  return apiRequest<MessageItem[]>(`/api/events/${id}/messages/`);
}

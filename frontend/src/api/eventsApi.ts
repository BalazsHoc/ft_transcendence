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
  imageFile?: File | null;
};

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}

function toEventFormData(payload: Partial<EventPayload>) {
  const form = new FormData();
  appendFormValue(form, "title", payload.title);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "sport", payload.sport);
  appendFormValue(form, "level", payload.level);
  appendFormValue(form, "languages", payload.languages);
  appendFormValue(form, "location_name", payload.location_name);
  appendFormValue(form, "location_address", payload.location_address);
  appendFormValue(form, "latitude", payload.latitude);
  appendFormValue(form, "longitude", payload.longitude);
  appendFormValue(form, "start_at", payload.start_at);
  appendFormValue(form, "end_at", payload.end_at);
  appendFormValue(form, "max_slots", payload.max_slots);
  if (payload.imageFile) form.append("image", payload.imageFile);
  return form;
}

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
    body: toEventFormData(payload),
  });
}
export function updateEvent(id: string, payload: Partial<EventPayload>) {
  return apiRequest<EventItem>(`/api/events/${id}/`, {
    method: "PATCH",
    body: toEventFormData(payload),
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

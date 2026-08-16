import { apiRequest } from "./client";
import type { EventItem, User, UserPresence } from "../types/api";

export function getPublicUser(id: string) {
  return apiRequest<User>(`/api/users/${id}/`);
}

export function getUserActivities(id: string) {
  return apiRequest<EventItem[]>(`/api/users/${id}/activities/`);
}

export function getUserPresence(id: string) {
  return apiRequest<UserPresence>(`/api/users/${id}/presence/`);
}

export function searchUsers(query: string) {
  return apiRequest<User[]>(`/api/users/?search=${encodeURIComponent(query)}`);
}

import { apiRequest } from "./client";
import type { EventItem, User } from "../types/api";

export function getPublicUser(id: string) {
  return apiRequest<User>(`/api/users/${id}/`);
}

export function getUserActivities(id: string) {
  return apiRequest<EventItem[]>(`/api/users/${id}/activities/`);
}

export function searchUsers(query: string) {
  return apiRequest<User[]>(`/api/users/?search=${encodeURIComponent(query)}`);
}

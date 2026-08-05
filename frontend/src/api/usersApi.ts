import { apiRequest } from "./client";
import type { User } from "../types/api";

export function getPublicUser(id: string) {
  return apiRequest<User>(`/api/users/${id}/`);
}

export function searchUsers(query: string) {
  return apiRequest<User[]>(`/api/users/?search=${encodeURIComponent(query)}`);
}

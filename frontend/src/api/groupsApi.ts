import { apiRequest } from "./client";
import type {
  EventItem,
  GroupItem,
  GroupPayload,
  PaginatedResponse,
} from "../types/api";

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}

function toGroupFormData(payload: Partial<GroupPayload>) {
  const form = new FormData();
  appendFormValue(form, "name", payload.name);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "sport", payload.sport);
  appendFormValue(form, "levels", payload.levels);
  appendFormValue(form, "max_members", payload.max_members);
  appendFormValue(form, "languages", payload.languages);
  appendFormValue(form, "location_name", payload.location_name);
  appendFormValue(form, "location_address", payload.location_address);
  if (payload.coverImageFile) form.append("cover_image", payload.coverImageFile);
  return form;
}

export type GroupListParams = {
  sport?: string;
  level?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function getGroupsPage(params?: GroupListParams) {
  const query = new URLSearchParams();
  if (params?.sport) query.set("sport", params.sport);
  if (params?.level) query.set("level", params.level);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedResponse<GroupItem>>(`/api/groups/${suffix}`);
}

/** Return the first API page as an array for compact/legacy consumers. */
export async function getGroups(params?: GroupListParams) {
  const page = await getGroupsPage({ pageSize: 100, ...params });
  return page.results;
}

export function getGroup(id: string) {
  return apiRequest<GroupItem>(`/api/groups/${id}/`);
}

export function createGroup(payload: GroupPayload) {
  return apiRequest<GroupItem>("/api/groups/", {
    method: "POST",
    body: toGroupFormData(payload),
  });
}

export function updateGroup(id: string, payload: Partial<GroupPayload>) {
  return apiRequest<GroupItem>(`/api/groups/${id}/`, {
    method: "PATCH",
    body: toGroupFormData(payload),
  });
}

export function joinGroup(id: string) {
  return apiRequest<{
    id: string;
    role: string;
    joined_at: string;
  }>(`/api/groups/${id}/join/`, { method: "POST" });
}

export function leaveGroup(id: string) {
  return apiRequest<void>(`/api/groups/${id}/leave/`, { method: "POST" });
}

export function getGroupEventsPage(id: string, page?: number) {
  const query = new URLSearchParams({ page_size: "100" });
  if (page) query.set("page", String(page));
  return apiRequest<PaginatedResponse<EventItem>>(
    `/api/groups/${id}/events/?${query.toString()}`,
  );
}

export async function getGroupEvents(id: string) {
  const page = await getGroupEventsPage(id);
  return page.results;
}

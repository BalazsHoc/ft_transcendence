import { apiRequest } from "./client";
import type { GroupItem, GroupPayload } from "../types/api";

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}

function toGroupFormData(payload: GroupPayload) {
  const form = new FormData();
  appendFormValue(form, "name", payload.name);
  appendFormValue(form, "description", payload.description);
  appendFormValue(form, "sport", payload.sport);
  appendFormValue(form, "levels", payload.levels);
  appendFormValue(form, "kind", payload.kind);
  appendFormValue(form, "visibility", payload.visibility);
  appendFormValue(form, "join_policy", payload.join_policy);
  appendFormValue(form, "max_members", payload.max_members);
  appendFormValue(form, "languages", payload.languages);
  appendFormValue(form, "location_name", payload.location_name);
  appendFormValue(form, "location_address", payload.location_address);
  if (payload.coverImageFile) form.append("cover_image", payload.coverImageFile);
  return form;
}

export function getGroups(params?: {
  sport?: string;
  level?: string;
  kind?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sport) query.set("sport", params.sport);
  if (params?.level) query.set("level", params.level);
  if (params?.kind) query.set("kind", params.kind);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<GroupItem[]>(`/api/groups/${suffix}`);
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

export function joinGroup(id: string) {
  return apiRequest(`/api/groups/${id}/join/`, { method: "POST" });
}

export function leaveGroup(id: string) {
  return apiRequest<void>(`/api/groups/${id}/leave/`, { method: "POST" });
}

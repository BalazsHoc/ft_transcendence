import { apiRequest } from "./client";
import { User } from "../types/api";
export type AuthResponse = { access: string; refresh: string; user?: User };

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}

export function register(payload: {
  username: string;
  email: string;
  password: string;
  district?: string;
  languages?: string[];
  interests?: string[];
}) {
  return apiRequest<AuthResponse>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function login(username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
export function getMe() {
  return apiRequest<User>("/api/auth/me/");
}
export function updateMe(
  payload: Partial<User> & { avatarFile?: File | null },
) {
  const form = new FormData();
  appendFormValue(form, "district", payload.district);
  appendFormValue(form, "languages", payload.languages);
  appendFormValue(form, "interests", payload.interests);
  if (payload.avatarFile) form.append("avatar", payload.avatarFile);
  return apiRequest<User>("/api/auth/me/", {
    method: "PATCH",
    body: form,
  });
}

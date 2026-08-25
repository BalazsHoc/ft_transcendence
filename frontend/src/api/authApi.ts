import { API_URL } from "./client";
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
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
  district: string;
  languages?: string[];
  interests?: string[];
}) {
  return apiRequest<AuthResponse>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      name: payload.name.trim(),
      password: payload.password,
      password_confirm: payload.passwordConfirm,
      district: payload.district,
      languages: payload.languages,
      interests: payload.interests,
    }),
  });
}
export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
  appendFormValue(form, "bio", payload.bio);
  appendFormValue(form, "languages", payload.languages);
  appendFormValue(form, "interests", payload.interests);
  if (payload.avatarFile) form.append("avatar", payload.avatarFile);
  return apiRequest<User>("/api/auth/me/", {
    method: "PATCH",
    body: form,
  });
}


export function exchangeGoogleTicket(ticket: string) {
  return apiRequest<AuthResponse>("/api/auth/google/exchange/", {
    method: "POST",
    body: JSON.stringify({ ticket }),
  });
}


export function getGoogleLoginUrl() {
  return `${API_URL}/api/auth/google/start/`;
}

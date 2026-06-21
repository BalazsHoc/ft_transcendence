import { apiRequest } from "./client";
import { User } from "../types/api";
export type AuthResponse = { access: string; refresh: string; user?: User };
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
export function updateMe(payload: Partial<User>) {
  return apiRequest<User>("/api/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

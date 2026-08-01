import { apiRequest } from "./client";
import type { SportOption } from "../types/api";

export function getSports() {
  return apiRequest<SportOption[]>("/api/meta/sports/");
}

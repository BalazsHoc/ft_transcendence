import { apiRequest } from "./client";
import type { SportOption } from "../types/api";
import type { DistrictOption } from "../types/api";

export function getSports() {
  return apiRequest<SportOption[]>("/api/meta/sports/");
}

export function getDistricts() {
  return apiRequest<DistrictOption[]>("/api/meta/districts/");
}

import { apiRequest } from "./client";

export type GeoSuggestion = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  source: string;
  raw: Record<string, unknown>;
};

export type GeoResponse = {
  provider: string;
  query: string;
  language: string;
  results: GeoSuggestion[];
};

export type MapTileStyle = {
  url: string;
  attribution: string;
};

export type MapStyleResponse = {
  provider: string;
  styles: {
    light: MapTileStyle;
    dark: MapTileStyle;
  };
};

export function getMapStyle() {
  return apiRequest<MapStyleResponse>("/api/geo/map-style/");
}

export function rememberSearch(
  payload: {
    query: string;
    suggestion: GeoSuggestion;
    language?: string;
    provider?: string;
  },
) {
  return apiRequest<GeoResponse>("/api/geo/remember/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchLocations(
  query: string,
  params?: { language?: string; provider?: string },
) {
  const q = new URLSearchParams();
  q.set("q", query);
  if (params?.language) q.set("language", params.language);
  if (params?.provider) q.set("provider", params.provider);
  return apiRequest<GeoResponse>(`/api/geo/search/?${q.toString()}`);
}

export function reverseGeocode(
  latitude: number,
  longitude: number,
  params?: { language?: string; provider?: string },
) {
  const q = new URLSearchParams();
  q.set("lat", String(latitude));
  q.set("lon", String(longitude));
  if (params?.language) q.set("language", params.language);
  if (params?.provider) q.set("provider", params.provider);
  return apiRequest<GeoResponse>(`/api/geo/reverse/?${q.toString()}`);
}

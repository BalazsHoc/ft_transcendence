export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
export const AUTH_TOKEN_REFRESHED_EVENT = "auth:token-refreshed";
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

// DRF validation errors look like { field: ["message"] } or { detail: "message" }.
// Pull out the first message instead of showing the caller the raw JSON blob.
function formatErrorMessage(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }
  return JSON.stringify(data, null, 2);
}
export function getAccessToken() {
  return localStorage.getItem("access") || "";
}
export function getRefreshToken() {
  return localStorage.getItem("refresh") || "";
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

let refreshInFlight: Promise<string | null> | null = null;

function emitAuthEvent(
  name: string,
  detail?: { access?: string },
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(API_URL + "/api/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const text = await response.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (
        !response.ok ||
        !data ||
        typeof data !== "object" ||
        typeof (data as { access?: unknown }).access !== "string"
      ) {
        clearTokens();
        emitAuthEvent(AUTH_SESSION_EXPIRED_EVENT);
        return null;
      }

      const nextAccess = (data as { access: string }).access;
      const nextRefresh =
        typeof (data as { refresh?: unknown }).refresh === "string"
          ? (data as { refresh: string }).refresh
          : refresh;
      setTokens(nextAccess, nextRefresh);
      emitAuthEvent(AUTH_TOKEN_REFRESHED_EVENT, { access: nextAccess });
      return nextAccess;
    } catch {
      clearTokens();
      emitAuthEvent(AUTH_SESSION_EXPIRED_EVENT);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function shouldRefreshAfterUnauthorized(path: string, access: string) {
  if (!access || !getRefreshToken()) return false;
  return ![
    "/api/auth/login/",
    "/api/auth/register/",
    "/api/auth/refresh/",
    "/api/auth/google/",
  ].some((authPath) => path.startsWith(authPath));
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (
    response.status === 401 &&
    allowRefresh &&
    shouldRefreshAfterUnauthorized(path, token)
  ) {
    const nextAccess = await refreshAccessToken();
    if (nextAccess) return apiRequest<T>(path, options, false);
  }
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) throw new Error(formatErrorMessage(data));
  return data as T;
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { User } from "../../types/api";
import { clearTokens, getAccessToken, setTokens } from "../../api/client";
import * as authApi from "../../api/authApi";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";
const PRESENCE_HEARTBEAT_MS = 30_000;

export type PresenceSnapshot = {
  is_online: boolean;
  last_seen: string | null;
};

type AuthContextValue = {
  user: User | null;
  access: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    name: string;
    password: string;
    passwordConfirm: string;
    district: string;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
  presenceByUser: Record<string, PresenceSnapshot>;
  getPresence: (user: User | null | undefined) => PresenceSnapshot;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState(getAccessToken());
  const [loading, setLoading] = useState(false);
  const [presenceByUser, setPresenceByUser] = useState<Record<string, PresenceSnapshot>>({});
  async function refreshMe() {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      const nextUser = await authApi.getMe();
      setUser(nextUser);
      setPresenceByUser((current) => ({
        ...current,
        [nextUser.id]: {
          is_online: Boolean(nextUser.is_online),
          last_seen: nextUser.last_seen ?? null,
        },
      }));
    } finally {
      setLoading(false);
    }
  }
  async function doLogin(email: string, password: string) {
    const data = await authApi.login(email, password);
    setTokens(data.access, data.refresh);
    setAccess(data.access);
    await refreshMe();
  }
  async function doRegister(payload: {
    email: string;
    name: string;
    password: string;
    passwordConfirm: string;
    district: string;
  }) {
    const data = await authApi.register({
      ...payload,
      languages: ["en", "de", "ua"],
      interests: ["football", "running"],
    });
    setTokens(data.access, data.refresh);
    setAccess(data.access);
    if (data.user) {
      setUser(data.user);
      setPresenceByUser((current) => ({
        ...current,
        [data.user!.id]: {
          is_online: Boolean(data.user!.is_online),
          last_seen: data.user!.last_seen ?? null,
        },
      }));
    }
    else await refreshMe();
  }
  function logout() {
    clearTokens();
    setAccess("");
    setUser(null);
    setPresenceByUser({});
  }
  useEffect(() => {
    refreshMe().catch(() => logout());
  }, []);

  useEffect(() => {
    if (!access || typeof WebSocket === "undefined") return undefined;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let reconnectAttempt = 0;

    const clearTimers = () => {
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      reconnectTimer = null;
      heartbeatTimer = null;
    };

    const connect = () => {
      if (cancelled) return;
      socket = new WebSocket(
        `${WS_URL}/ws/presence/?token=${encodeURIComponent(access)}`,
      );
      socket.onopen = () => {
        reconnectAttempt = 0;
        heartbeatTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "heartbeat" }));
          }
        }, PRESENCE_HEARTBEAT_MS);
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type?: string;
            user_id?: string;
            is_online?: boolean;
            last_seen?: string | null;
          };
          if (
            data.type !== "presence_update" ||
            !data.user_id ||
            typeof data.is_online !== "boolean"
          ) {
            return;
          }
          setPresenceByUser((current) => ({
            ...current,
            [data.user_id!]: {
              is_online: data.is_online!,
              last_seen: data.last_seen ?? null,
            },
          }));
        } catch {
          // Ignore malformed presence events and keep the connection alive.
        }
      };
      socket.onclose = (event) => {
        clearTimers();
        socket = null;
        if (cancelled || event.code === 4001) return;
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 10_000);
        reconnectAttempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      cancelled = true;
      clearTimers();
      socket?.close();
      socket = null;
    };
  }, [access]);

  const getPresence = (target: User | null | undefined): PresenceSnapshot => {
    if (!target) return { is_online: false, last_seen: null };
    return presenceByUser[target.id] || {
      is_online: Boolean(target.is_online),
      last_seen: target.last_seen ?? null,
    };
  };

  const value = useMemo(
    () => ({
      user,
      access,
      loading,
      login: doLogin,
      register: doRegister,
      refreshMe,
      logout,
      presenceByUser,
      getPresence,
    }),
    [user, access, loading, presenceByUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

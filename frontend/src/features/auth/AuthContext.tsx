import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User } from "../../types/api";
import { clearTokens, getAccessToken, setTokens } from "../../api/client";
import * as authApi from "../../api/authApi";
type AuthContextValue = {
  user: User | null;
  access: string;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    district?: string;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState(getAccessToken());
  const [loading, setLoading] = useState(false);
  async function refreshMe() {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      setUser(await authApi.getMe());
    } finally {
      setLoading(false);
    }
  }
  async function doLogin(username: string, password: string) {
    const data = await authApi.login(username, password);
    setTokens(data.access, data.refresh);
    setAccess(data.access);
    await refreshMe();
  }
  async function doRegister(payload: {
    username: string;
    email: string;
    password: string;
    district?: string;
  }) {
    const data = await authApi.register({
      ...payload,
      languages: ["en", "de", "ua"],
      interests: ["football", "running"],
    });
    setTokens(data.access, data.refresh);
    setAccess(data.access);
    if (data.user) setUser(data.user);
    else await refreshMe();
  }
  function logout() {
    clearTokens();
    setAccess("");
    setUser(null);
  }
  useEffect(() => {
    refreshMe().catch(() => logout());
  }, []);
  const value = useMemo(
    () => ({
      user,
      access,
      loading,
      login: doLogin,
      register: doRegister,
      refreshMe,
      logout,
    }),
    [user, access, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

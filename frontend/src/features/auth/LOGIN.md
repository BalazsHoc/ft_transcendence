# How Login Works (Simple Guide)

This explains what happens, step by step, when a user logs in.

## The 4 files involved

1. `frontend/src/pages/auth/LoginPage.tsx` — the form the user sees and types into.
2. `frontend/src/features/auth/AuthContext.tsx` — the "manager" that decides what to do when login happens.
3. `frontend/src/api/authApi.ts` — describes *which* backend endpoint to call.
4. `frontend/src/api/client.ts` — the file that actually sends the request over the network.

Each file only knows about the one below it. The form doesn't know about `fetch`, and `client.ts` doesn't know anything about forms.

## Step by step

### 1. User submits the form

File: `frontend/src/pages/auth/LoginPage.tsx`

```tsx
export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("alex");
  const [password, setPassword] = useState("testpass123");
  const [log, setLog] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(username, password);
      setLog("Login successful.");
      navigate("/discover");
    } catch (e: any) {
      setLog(e.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit">Log in</Button>
    </form>
  );
}
```

The page just calls `login(...)`. It has no idea how login actually happens — that comes from `useAuth()`.

### 2. AuthContext does the work

File: `frontend/src/features/auth/AuthContext.tsx`

```tsx
async function doLogin(username: string, password: string) {
  const data = await authApi.login(username, password); // 1. call backend
  setTokens(data.access, data.refresh);                  // 2. save the keys
  setAccess(data.access);
  await refreshMe();                                      // 3. fetch user info
}

async function refreshMe() {
  if (!getAccessToken()) return;
  setLoading(true);
  try {
    setUser(await authApi.getMe());
  } finally {
    setLoading(false);
  }
}
```

Three jobs `doLogin` does:
1. Send username/password to the backend.
2. Save the tokens it gets back (like a receipt proving you're logged in).
3. Use that receipt to fetch your profile info (`refreshMe`).

### 3. authApi says *where* to send it

File: `frontend/src/api/authApi.ts`

```tsx
export type AuthResponse = { access: string; refresh: string; user?: User };

export function login(username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getMe() {
  return apiRequest<User>("/api/auth/me/");
}
```

This just says: "POST this username/password to `/api/auth/login/`" and "GET `/api/auth/me/`". No `fetch`, no headers, no localStorage — just the endpoint and the shape of data expected back.

### 4. client.ts actually sends it

File: `frontend/src/api/client.ts`

```ts
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function getAccessToken() {
  return localStorage.getItem("access") || "";
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
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
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok)
    throw new Error(
      typeof data === "string" ? data : JSON.stringify(data, null, 2),
    );
  return data as T;
}
```

This is the only place `fetch` is called in the whole app. It also:
- Attaches your saved token to every request (`Authorization: Bearer <token>`), so the backend knows who you are.
- Reads the response as text, then tries to turn it into JSON.
- Throws an error if the request failed (`!response.ok`), so `LoginPage.tsx`'s `try/catch` can catch it and show a message via `setLog(e.message)`.

## Getting your data (the "me" call)

Once login succeeds and the token is saved, `AuthContext` calls `authApi.getMe()`, which is a GET request with no body — but `client.ts` automatically attaches the saved token, so the backend knows it's *you* asking for *your* data. The response becomes `user`, available anywhere in the app via `useAuth().user`.

## The whole trip, in order

```
User clicks "Log in"
  -> LoginPage.tsx: submit() calls login()
  -> AuthContext.tsx: doLogin()
       -> authApi.ts: login() -> client.ts: apiRequest() -> fetch POST /api/auth/login/
       -> setTokens() saves access + refresh to localStorage
       -> AuthContext.tsx: refreshMe()
            -> authApi.ts: getMe() -> client.ts: apiRequest() -> fetch GET /api/auth/me/
               (Authorization: Bearer <token> attached automatically)
            -> setUser() saves the profile to React state
  -> LoginPage.tsx: navigate("/discover")
```

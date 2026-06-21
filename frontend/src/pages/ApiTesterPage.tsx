import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../api/client";
import { ApiLog } from "../components/shared/ApiLog";

const routes = [
  ["GET", "/"],
  ["GET", "/api/auth/me/"],
  ["GET", "/api/events/"],
  ["POST", "/api/events/"],
] as const;
export function ApiTesterPage() {
  const { t } = useTranslation();
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/events/");
  const [body, setBody] = useState("{}");
  const [log, setLog] = useState("");
  async function run() {
    try {
      const data = await apiRequest(path, {
        method,
        body: method === "GET" ? undefined : body,
      });
      setLog(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setLog(e.message);
    }
  }
  return (
    <>
      <h1>{t("apiTest.title")}</h1>
      <section className="form-card">
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
        <input value={path} onChange={(e) => setPath(e.target.value)} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        <button onClick={run}>Run</button>
        <div className="row">
          {routes.map(([m, p]) => (
            <button
              type="button"
              key={`${m}${p}`}
              onClick={() => {
                setMethod(m);
                setPath(p);
              }}
            >
              {m} {p}
            </button>
          ))}
        </div>
      </section>
      <ApiLog log={log} />
    </>
  );
}

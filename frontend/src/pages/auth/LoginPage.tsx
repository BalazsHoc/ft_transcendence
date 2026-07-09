import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { ApiLog } from "../../components/shared/ApiLog";
import { PhotoBackdrop } from "../../components/shared/PhotoBackdrop";
import styles from "../../components/shared/FormCard.module.css";

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
    <div className="login-page-full relative flex h-full items-center justify-center overflow-hidden px-5">
      <PhotoBackdrop />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        <h1 className="mb-6 font-display text-2xl font-bold text-[var(--text)]">
          {t("auth.loginTitle")}
        </h1>
        <form className={styles.formCard} onSubmit={submit}>
          <label>
            {t("auth.username")}
            <input
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            />
          </label>
          <label>
            {t("auth.password")}
            <input
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </label>
          <button>{t("auth.submitLogin")}</button>
        </form>
        <div className="mt-6">
          <ApiLog log={log} />
        </div>
      </div>
    </div>
  );
}

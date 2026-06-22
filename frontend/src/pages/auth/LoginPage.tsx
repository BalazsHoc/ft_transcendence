import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { ApiLog } from "../../components/shared/ApiLog";
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
    <>
      <h1>{t("auth.loginTitle")}</h1>
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
      <ApiLog log={log} />
    </>
  );
}

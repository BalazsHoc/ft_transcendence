import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { PhotoBackdrop } from "../../components/shared/PhotoBackdrop";
import Button from "../../components/shared/Button";
import styles from "../../components/shared/FormCard.module.css";
import { getGoogleLoginUrl } from "../../api/authApi";

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/discover");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="login-page-full relative flex h-full items-center justify-center overflow-hidden px-5">
      <PhotoBackdrop />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        <h1 className={`mb-6 font-display text-2xl font-bold ${styles.pageTitle}`}>
          {t("auth.loginTitle")}
        </h1>
        <form className={styles.formCard} onSubmit={submit}>
          <label>
            <span className={styles.labelText}>{t("auth.email")}</span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span className={styles.labelText}>{t("auth.password")}</span>
            <input
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete="current-password"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </label>
          <Button type="submit" variant="primary">
            {t("auth.submitLogin")}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-sm text-white/70">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {window.location.assign(getGoogleLoginUrl());}}>
          {t("auth.continueWithGoogle")}
        </Button>
        {error && (
          <p className="mt-4 text-center text-sm text-white">{error}</p>
        )}
        <p className="mt-4 text-center text-sm text-sky-200">
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-sky-100 underline hover:font-bold"
          >
            {t("auth.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

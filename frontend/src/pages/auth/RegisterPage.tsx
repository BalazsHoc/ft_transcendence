import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { PhotoBackdrop } from "../../components/shared/PhotoBackdrop";
import Button from "../../components/shared/Button";
import styles from "../../components/shared/FormCard.module.css";
import { useDistricts } from "../../hooks/useDistricts";

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const districts = useDistricts();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2) {
      setError(t("auth.nameRequired"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.passwordMinLength"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (!district) {
      setError(t("auth.districtRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await register({
        name: normalizedName,
        email: normalizedEmail,
        password,
        passwordConfirm,
        district,
      });
      navigate("/discover");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page-full relative flex h-full items-center justify-center overflow-hidden px-5">
      <PhotoBackdrop />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        <h1 className={`mb-6 font-display text-2xl font-bold ${styles.pageTitle}`}>
          {t("auth.registerTitle")}
        </h1>
        <form className={styles.formCard} onSubmit={submit}>
          <label>
            <span className={styles.labelText}>{t("auth.name")}</span>
            <input
              value={name}
              required
              minLength={2}
              maxLength={150}
              autoComplete="name"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </label>
          <label>
            <span className={styles.labelText}>{t("auth.email")}</span>
            <input
              value={email}
              type="email"
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
              autoComplete="new-password"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </label>
          <label>
            <span className={styles.labelText}>{t("auth.passwordConfirm")}</span>
            <input
              type="password"
              value={passwordConfirm}
              required
              minLength={8}
              autoComplete="new-password"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordConfirm(e.target.value)}
            />
          </label>
          <label>
            <span className={styles.labelText}>{t("auth.district")}</span>
            <select
              value={district}
              required
              disabled={districts.length === 0}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDistrict(e.target.value)}
            >
              <option value="" disabled>
                {districts.length === 0 ? t("auth.loadingDistricts") : t("auth.selectDistrict")}
              </option>
              {districts.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.code} — {option.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="primary" disabled={submitting || districts.length === 0}>
            {submitting ? t("auth.creating") : t("auth.submitRegister")}
          </Button>
        </form>
        {error && (
          <p className="mt-4 text-center text-sm text-white">{error}</p>
        )}
        <p className="mt-4 text-center text-sm text-sky-200">
          {t("auth.haveAccount")}{" "}
          <Link
            to="/login"
            className="font-medium text-sky-100 underline hover:font-bold"
          >
            {t("auth.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

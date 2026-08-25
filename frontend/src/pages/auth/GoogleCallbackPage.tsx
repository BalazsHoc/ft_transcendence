import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";

export function GoogleCallbackPage() {
  const { t } = useTranslation();
  const { completeGoogleLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [hasError, setHasError] = useState(false);

  const ticket = searchParams.get("ticket");

  useEffect(() => {
    if (!ticket || started.current) return;

    started.current = true;

    completeGoogleLogin(ticket)
      .then(() => {
        // Replace removes the ticket-bearing page from browser history.
        navigate("/discover", { replace: true });
      })
      .catch(() => {
        setHasError(true);
      });
  }, [ticket, completeGoogleLogin, navigate]);

  if (!ticket) {
    return <Navigate to="/login" replace />;
  }

  if (hasError) {
    return (
      <main>
        <h1>{t("auth.googleLoginFailed")}</h1>
      </main>
    );
  }

  return <main>{t("auth.completingGoogleLogin")}</main>;
}

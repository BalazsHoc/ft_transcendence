import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)]"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted)]">ft_transcendence</p>
        <h1 className="font-display text-4xl font-bold text-[var(--text)]">Privacy Policy</h1>
      </header>

      <section className="space-y-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-sm">
        <p>This is a temporary privacy policy page for the MVP.</p>
        <p>
          The final policy will explain what account, activity, and communication data we collect, why we use it,
          and how users can contact the project team about their data.
        </p>
        <p>Content will be reviewed and replaced before production release.</p>
      </section>
    </section>
  );
}

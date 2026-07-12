import { User } from "../../types/api";

type ProfileAboutProps = {
  user: User | null;
};

export function ProfileAbout({ user }: ProfileAboutProps) {
  const languages = user?.languages?.length ? user.languages.join(", ") : "Not set";
  const focusAreas = user?.interests?.length ? user.interests.join(", ") : "Not set";

  return (
    <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">About</h3>

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Languages
          </h4>
          <p className="text-sm text-[var(--text)]">{languages}</p>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Focus Areas
          </h4>
          <p className="text-sm text-[var(--text)]">{focusAreas}</p>
        </div>
      </div>
    </div>
  );
}

type BentoInfoCardProps = {
  tag: string;
  title: string;
  description: string;
  attendingLabel: string;
  onClick: () => void;
};

export function BentoInfoCard({
  tag,
  title,
  description,
  attendingLabel,
  onClick,
}: BentoInfoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col justify-between rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
    >
      <div>
        <span className="mb-4 inline-block rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--text)]">
          {tag}
        </span>
        <h3 className="mb-2 font-display text-2xl font-semibold text-[var(--text)]">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex -space-x-2">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--surface)] bg-teal-200" />
          <div className="h-8 w-8 rounded-full border-2 border-[var(--surface)] bg-teal-300" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-teal-600 text-[10px] font-bold text-white">
            +12
          </div>
        </div>
        <span className="text-xs font-medium text-[var(--muted)]">
          {attendingLabel}
        </span>
      </div>
    </button>
  );
}

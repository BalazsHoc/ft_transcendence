type BentoInfoCardProps = {
  tag: string;
  title: string;
  description: string;
  attendingLabel: string;
  onClick: () => void;
  image?: string;
};

export function BentoInfoCard({
  tag,
  title,
  description,
  attendingLabel,
  onClick,
  image,
}: BentoInfoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
        image
          ? ""
          : "border border-[var(--surface-border)] bg-[var(--surface)]"
      }`}
    >
      {image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </>
      )}

      <div className="relative">
        <span
          className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${
            image
              ? "bg-white/90 text-black"
              : "bg-[var(--bg)] text-[var(--text)]"
          }`}
        >
          {tag}
        </span>
        <h3
          className={`mb-2 font-display text-2xl font-semibold ${
            image ? "text-white" : "text-[var(--text)]"
          }`}
        >
          {title}
        </h3>
        <p
          className={`line-clamp-2 text-sm ${
            image ? "text-white/80" : "text-[var(--muted)]"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <div className="flex -space-x-2">
          <div
            className={`h-8 w-8 rounded-full border-2 bg-teal-200 ${image ? "border-white/60" : "border-[var(--surface)]"}`}
          />
          <div
            className={`h-8 w-8 rounded-full border-2 bg-teal-300 ${image ? "border-white/60" : "border-[var(--surface)]"}`}
          />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-teal-600 text-[10px] font-bold text-white ${image ? "border-white/60" : "border-[var(--surface)]"}`}
          >
            +12
          </div>
        </div>
        <span
          className={`text-xs font-medium ${image ? "text-white/80" : "text-[var(--muted)]"}`}
        >
          {attendingLabel}
        </span>
      </div>
    </button>
  );
}

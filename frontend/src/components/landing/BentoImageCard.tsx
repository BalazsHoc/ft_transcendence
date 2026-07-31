import { ArrowRight, ArrowUpRight } from "lucide-react";

type BentoImageCardProps = {
  image: string;
  title: string;
  onClick: () => void;
  size?: "lg" | "sm";
  tag?: string;
  description?: string;
  className?: string;
};

export function BentoImageCard({
  image,
  title,
  onClick,
  size = "sm",
  tag,
  description,
  className = "",
}: BentoImageCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('${image}')` }}
      />

      {size === "lg" ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/10 p-8 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                {tag && (
                  <span className="mb-3 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black">
                    {tag}
                  </span>
                )}
                <h3 className="mb-2 font-display text-2xl font-semibold text-white">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-white/80">{description}</p>
                )}
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-110">
                <ArrowRight size={20} />
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
            <span className="font-display text-lg font-semibold text-white">
              {title}
            </span>
            <ArrowUpRight className="text-white" size={20} />
          </div>
        </>
      )}
    </button>
  );
}

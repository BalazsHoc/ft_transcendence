type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "live" | "solid";
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantClasses = {
    default:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--surface-border)]",
    live: "bg-red-600 text-white",
    solid: "bg-[var(--text)] text-[var(--surface)]",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

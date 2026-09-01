
import React from "react";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "primary" | "teal" | "amber" | "glass" | "indigo" | "gray" | "emerald" | "midnight";
  size?: "xs" | "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

export default function Badge({
  children,
  variant = "gray",
  size = "sm",
  className = "",
  icon
}: BadgeProps) {
  // A badge is a label, not an action:
  // keep it compact, readable, and visually consistent across the app.
  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] border font-semibold uppercase tracking-[0.18em] shrink-0";

  const variantClasses = {
    primary: "border-transparent bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]",
    midnight: "border-transparent bg-slate-950 text-white",
    teal:
      "border-[var(--badge-teal-border)] bg-[var(--badge-teal-bg)] text-[var(--badge-teal-text)]",
    amber:
      "border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]",
    indigo:
      "border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)]",
    gray:
      "border-[var(--badge-gray-border)] bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
    emerald:
      "border-[var(--badge-emerald-border)] bg-[var(--badge-emerald-bg)] text-[var(--badge-emerald-text)]",
    glass: "border-white/60 bg-white/70 text-slate-800 backdrop-blur-md",
  };

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[9px]",
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-3.5 py-1.5 text-xs",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

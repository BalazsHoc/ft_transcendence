import React from "react";

type IconButtonProps = {
  icon: React.ReactNode;
  "aria-label": string;
  variant?: "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "aria-expanded"?: boolean;
};

const sizeClasses: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const variantClasses: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  ghost:
    "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]",
  outline:
    "bg-transparent text-[var(--text)] border border-[var(--surface-border)] hover:bg-[var(--surface)]",
};

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={props["aria-label"]}
      className={[
        "inline-flex items-center justify-center rounded-[var(--radius-button)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {icon}
    </button>
  );
}

import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "outline" | "glass" | "indigo";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  [key: string]: any;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  iconOnly = false,
  className = "",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  /**
   * Base:
   * We avoid relying on global `button {}` styles because this component
   * is the shared API layer. It should be predictable everywhere.
   */
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 shrink-0";

  /**
   * Variants use ONLY global CSS variables defined in global.css.
   * This keeps theme + dark mode consistent.
   */
  const variantClasses: Record<string, string> = {
    primary:
      "bg-[var(--button-bg)] text-[var(--button-text)] border border-[var(--button-border)] hover:opacity-90",

    secondary:
      "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)] backdrop-blur-md hover:opacity-90",

    outline:
      "bg-transparent text-[var(--text)] border border-[var(--surface-border)] hover:bg-[var(--surface)]",

    danger:
      "bg-red-600 text-white border border-red-600 hover:bg-red-700",

    glass:
      "bg-white/20 text-white border border-white/40 backdrop-blur-md hover:bg-white/30",

    indigo:
      "bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700",
  };

  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-[11px]",
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const iconOnlySizeClasses = {
    xs: "h-7 w-7 p-0",
    sm: "h-8 w-8 p-0",
    md: "h-10 w-10 p-0",
    lg: "h-12 w-12 p-0",
  };

  const isIconOnly = iconOnly && icon;

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={props["aria-label"]}
      className={[
        baseClasses,
        variantClasses[variant],
        isIconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {isIconOnly ? (
        <span className="inline-flex shrink-0">{icon}</span>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className="inline-flex shrink-0">{icon}</span>
          )}

          {children && <span>{children}</span>}

          {icon && iconPosition === "right" && (
            <span className="inline-flex shrink-0">{icon}</span>
          )}
        </>
      )}
    </button>
  );
}
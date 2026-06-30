
import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "outline" | "glass" | "indigo";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (event: any) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
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
  ...props
}: ButtonProps) {
  // The component API is intentionally small:
  // - `variant` changes emphasis and color
  // - `size` changes spacing and typography
  // - `icon` is optional and never changes the button meaning
  // - `iconOnly` is for compact tool buttons and requires an aria-label
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shrink-0";

  const variantClasses = {
    primary:
      "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm hover:bg-[var(--btn-primary-hover)] hover:shadow-md",
    secondary:
      "border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] backdrop-blur-md hover:bg-[var(--btn-secondary-hover)]",
    outline:
      "border border-[var(--btn-outline-border)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] hover:border-[var(--btn-outline-hover-border)] hover:text-[var(--btn-outline-hover-text)]",
    danger: "bg-red-300 text-white shadow-sm <hover:bg-red-7></hover:bg-red-7>00",
    indigo:
      "border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)] hover:brightness-95",
    glass:
      "border border-white/60 bg-white/25 text-white shadow-sm backdrop-blur-md hover:bg-white/35",
  };

  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-[10px]",
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-2.5 text-xs md:text-sm",
    lg: "px-8 py-4 text-sm md:text-base"
  };

  const iconOnlySizeClasses = {
    xs: "h-7 w-7 p-0",
    sm: "h-8 w-8 p-0",
    md: "h-10 w-10 p-0",
    lg: "h-12 w-12 p-0",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size]} ${className}`}
      {...props}
    >
      {iconOnly && icon ? (
        <span className="inline-flex shrink-0">{icon}</span>
      ) : null}

      {!iconOnly && icon && iconPosition === "left" && (
        <span className="mr-2 inline-flex shrink-0">{icon}</span>
      )}
      {!iconOnly && <span>{children}</span>}
      {!iconOnly && icon && iconPosition === "right" && (
        <span className="ml-2 inline-flex shrink-0">{icon}</span>
      )}
    </button>
  );
}

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "icon" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children?: ReactNode;
}

// Every variant defines its own background AND foreground so nothing ever
// inherits an invisible color. All buttons are 38px tall so they align in a row.
const base =
  "inline-flex items-center justify-center gap-1.5 h-[38px] rounded-[9px] " +
  "font-medium text-sm whitespace-nowrap transition-colors shrink-0 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-white hover:bg-white/90 text-ink px-4",
  secondary:
    "bg-surface2 hover:bg-border text-text border-none px-4",
  danger:
    "bg-transparent border border-danger/40 text-danger hover:bg-danger/10 px-4",
  icon: "bg-surface2 hover:bg-border text-text w-[38px] p-0",
};

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

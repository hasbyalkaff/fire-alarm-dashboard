import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-strong active:-translate-y-px",
  secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-muted active:-translate-y-px",
  ghost: "text-fg hover:bg-surface-muted",
  // Destructive uses neutral-with-warning styling, never the alarm red (Design System §3.1).
  destructive: "border border-border-strong bg-surface text-[color:var(--status-fault-fg)] hover:bg-surface-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium transition-[background-color,transform] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

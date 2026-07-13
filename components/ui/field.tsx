import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "h-10 w-full rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle disabled:opacity-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...props },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(controlClass, error && "border-[color:var(--status-fault-fg)]", className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-fg-subtle">{hint}</p>}
      {error && (
        // Validation errors use fault amber, never the sacred alarm red (Design System §3.1).
        <p id={`${inputId}-error`} className="text-xs" style={{ color: "var(--status-fault-fg)" }}>
          {error}
        </p>
      )}
    </div>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, className, children, ...props },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-fg-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        // Explicit bg/color so native menu is correct in Windows dark mode.
        className={cn(controlClass, "cursor-pointer bg-surface", className)}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

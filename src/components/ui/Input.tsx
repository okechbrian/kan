import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className = "", ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-bold text-navy"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal ${
          error ? "border-guava" : "border-navy/20"
        } ${className}`.trim()}
        {...rest}
      />
      {error ? (
        <p className="text-xs font-semibold text-guava-dark">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-navy/60">{helperText}</p>
      ) : null}
    </div>
  );
});

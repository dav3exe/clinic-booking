import type { ComponentProps } from "react";

type FormFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

/** Labelled input with a field-level error (or hint). Works with react-hook-form's register(). */
export function FormField({ id, label, error, hint, className = "", ...input }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        className={`w-full rounded-xl border bg-background px-4 py-3 outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15 ${
          error ? "border-red-500" : "border-line"
        } ${className}`}
        {...input}
      />
      {error ? (
        <p id={`${id}-note`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-note`} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

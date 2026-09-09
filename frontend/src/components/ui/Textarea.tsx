import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/cn";
import { fieldBaseClasses, fieldErrorClasses, fieldSizeClasses } from "./fieldStyles";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md";
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, size = "md", id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBaseClasses, fieldSizeClasses[size], error && fieldErrorClasses, className)}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

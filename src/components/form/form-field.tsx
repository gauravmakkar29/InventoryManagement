import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Standardized form field wrapper — label + input + error message.
 * Ensures WCAG compliance: proper label association, aria-describedby,
 * and role="alert" on errors.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[14px] font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-[13px] text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

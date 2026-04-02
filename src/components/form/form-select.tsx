import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

/**
 * Standardized select dropdown — consistent styling with FormInput.
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ error, className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-card px-3 text-[15px] text-foreground",
        "focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text",
        "disabled:cursor-not-allowed disabled:opacity-60",
        error && "border-red-400 focus:border-red-500 focus:ring-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

FormSelect.displayName = "FormSelect";

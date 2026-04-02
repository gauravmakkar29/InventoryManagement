import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Standardized text input — consistent styling, error state, focus ring.
 * Use with react-hook-form's register() or as controlled input.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-card px-3 text-[15px] text-foreground",
        "placeholder:text-muted-foreground",
        "focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text",
        "disabled:cursor-not-allowed disabled:opacity-60",
        error && "border-red-400 focus:border-red-500 focus:ring-red-500",
        className,
      )}
      {...props}
    />
  ),
);

FormInput.displayName = "FormInput";

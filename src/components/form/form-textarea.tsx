import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * Standardized textarea — consistent styling with FormInput.
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-white px-3 py-2 text-[15px] text-foreground resize-none",
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

FormTextarea.displayName = "FormTextarea";

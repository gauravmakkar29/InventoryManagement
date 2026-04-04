import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Shared empty state — consistent "no data" display across all tables and lists.
 * Standardizes: icon h-10 w-10, heading text-[15px], description text-[14px].
 *
 * @see Story 23.6 (#304) — consolidates 8 implementations
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-5 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted p-2.5">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-[15px] font-medium text-foreground/80">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-center text-[14px] text-muted-foreground">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

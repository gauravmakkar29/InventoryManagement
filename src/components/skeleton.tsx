import { cn } from "../lib/utils";

/**
 * Shimmer skeleton placeholder for loading states.
 * Renders an animated gradient bar that pulses left-to-right.
 *
 * @example
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-10 w-full rounded-md" />
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} {...props} />;
}

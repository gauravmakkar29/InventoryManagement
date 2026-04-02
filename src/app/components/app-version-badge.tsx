/**
 * IMS Gen 2 — App Version Badge
 *
 * Compact version display component showing "v1.2.0 (abc1234)".
 * Used in the sidebar footer and settings page.
 *
 * @see Story #232 — Application versioning strategy
 */

import { cn } from "@/lib/utils";
import { getVersionDisplay, getVersionFull } from "@/lib/app-version";

interface AppVersionBadgeProps {
  /** Show abbreviated form (just "v") when true — used in collapsed sidebar. */
  compact?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

export function AppVersionBadge({ compact = false, className }: AppVersionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block text-muted-foreground/60 select-none",
        compact ? "text-[10px]" : "text-[11px]",
        className,
      )}
      title={getVersionFull()}
      aria-label={`Application version: ${getVersionDisplay()}`}
    >
      {compact ? "v" : getVersionDisplay()}
    </span>
  );
}

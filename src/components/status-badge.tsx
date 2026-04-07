import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Color mappings — single source of truth for badge colors
// ---------------------------------------------------------------------------

/** Severity levels (vulnerability, incident, alert) */
const SEVERITY_STYLES: Record<string, string> = {
  Critical: "bg-danger-bg text-danger-text border-danger-border",
  High: "bg-high-bg text-high-text border-high-bg",
  Medium: "bg-warning-bg text-warning-text border-warning-bg",
  Low: "bg-info-bg text-info-text border-info-bg",
  Info: "bg-muted text-muted-foreground border-border",
};

/** Status values (device, service order, firmware, incident) */
const STATUS_STYLES: Record<string, string> = {
  Online: "bg-success-bg text-success-text border-success-bg",
  Offline: "bg-danger-bg text-danger-text border-danger-border",
  Active: "bg-success-bg text-success-text border-success-bg",
  Inactive: "bg-muted text-muted-foreground border-border",
  Pending: "bg-warning-bg text-warning-text border-warning-bg",
  Approved: "bg-success-bg text-success-text border-success-bg",
  Rejected: "bg-danger-bg text-danger-text border-danger-border",
  Deprecated: "bg-muted text-muted-foreground border-border",
  Scheduled: "bg-info-bg text-info-text border-info-bg",
  "In Progress": "bg-warning-bg text-warning-text border-warning-bg",
  Completed: "bg-success-bg text-success-text border-success-bg",
  Cancelled: "bg-muted text-muted-foreground border-border",
  Open: "bg-danger-bg text-danger-text border-danger-border",
  Investigating: "bg-high-bg text-high-text border-high-bg",
  Contained: "bg-warning-bg text-warning-text border-warning-bg",
  Resolved: "bg-success-bg text-success-text border-success-bg",
  Closed: "bg-muted text-muted-foreground border-border",
  Consumed: "bg-success-bg text-success-text border-success-bg",
  Expired: "bg-muted text-muted-foreground border-border",
  Revoked: "bg-danger-bg text-danger-text border-danger-border",
};

/** Category values (incident, compliance, device type) */
const CATEGORY_STYLES: Record<string, string> = {
  Security: "bg-danger-bg text-danger-text",
  Hardware: "bg-info-bg text-info-text",
  Network: "bg-purple-50 text-purple-600",
  Firmware: "bg-high-bg text-high-text",
  Environmental: "bg-success-bg text-success-text",
  Software: "bg-indigo-50 text-indigo-600",
  Compliance: "bg-cyan-50 text-cyan-600",
};

/** Action values (audit log) */
const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-success-bg text-success-text",
  UPDATE: "bg-info-bg text-info-text",
  DELETE: "bg-danger-bg text-danger-text",
  APPROVE: "bg-success-bg text-success-text",
  REJECT: "bg-danger-bg text-danger-text",
  LOGIN: "bg-indigo-50 text-indigo-700",
  LOGOUT: "bg-muted text-muted-foreground",
};

const FALLBACK_STYLE = "bg-muted text-muted-foreground border-border";

type BadgeVariant = "severity" | "status" | "category" | "action";

const VARIANT_MAP: Record<BadgeVariant, Record<string, string>> = {
  severity: SEVERITY_STYLES,
  status: STATUS_STYLES,
  category: CATEGORY_STYLES,
  action: ACTION_STYLES,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  variant: BadgeVariant;
  value: string;
  /** Show a colored dot indicator before the label */
  dot?: boolean;
  className?: string;
}

/**
 * Shared status badge — consistent badge rendering across the entire application.
 * Standardizes: px-2 py-0.5, text-[12px] font-medium, rounded-full.
 *
 * @see Story 23.5 (#303) — consolidates 8+ badge implementations
 */
export function StatusBadge({ variant, value, dot = false, className }: StatusBadgeProps) {
  const styles = VARIANT_MAP[variant];
  const colorClass = styles[value] ?? FALLBACK_STYLE;
  const hasBorder = colorClass.includes("border-");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium",
        hasBorder && "border",
        colorClass,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            colorClass.includes("text-danger") && "bg-danger",
            colorClass.includes("text-high") && "bg-high",
            colorClass.includes("text-warning") && "bg-warning",
            colorClass.includes("text-success") && "bg-success",
            colorClass.includes("text-info") && "bg-info",
            colorClass.includes("text-purple") && "bg-purple-500",
            colorClass.includes("text-indigo") && "bg-indigo-500",
            colorClass.includes("text-cyan") && "bg-cyan-500",
            colorClass.includes("text-muted") && "bg-muted-foreground",
          )}
        />
      )}
      {value}
    </span>
  );
}

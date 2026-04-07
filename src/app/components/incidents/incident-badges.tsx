/**
 * IMS Gen 2 — Epic 14: Badge components for incidents
 */
import { cn } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus, IncidentCategory } from "@/lib/incident-types";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/incident-types";

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------
export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const styles: Record<IncidentSeverity, string> = {
    Critical: "bg-danger-bg text-danger-text border-danger-border",
    High: "bg-high-bg text-high-text border-high-bg",
    Medium: "bg-warning-bg text-warning-text border-warning-bg",
    Low: "bg-info-bg text-info-text border-info-bg",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-semibold",
        styles[severity],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SEVERITY_COLORS[severity] }}
      />
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
export function StatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    Open: "bg-danger-bg text-danger-text border-danger-border",
    Investigating: "bg-high-bg text-high-text border-high-bg",
    Contained: "bg-warning-bg text-warning-text border-warning-bg",
    Resolved: "bg-success-bg text-success-text border-success-bg",
    Closed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-semibold",
        styles[status],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------
export function CategoryBadge({ category }: { category: IncidentCategory }) {
  const styles: Record<IncidentCategory, string> = {
    Security: "bg-danger-bg text-danger-text",
    Hardware: "bg-info-bg text-info-text",
    Network: "bg-purple-50 text-purple-600",
    Firmware: "bg-high-bg text-high-text",
    Environmental: "bg-success-bg text-success-text",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium",
        styles[category],
      )}
    >
      {category}
    </span>
  );
}

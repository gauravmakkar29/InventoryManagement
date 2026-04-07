import { Shield, ShieldCheck, ShieldX, Clock, Archive } from "lucide-react";
import type { Role } from "../../../lib/rbac";
import { canPerformAction } from "../../../lib/rbac";
import type {
  ComplianceStatus,
  VulnSeverity,
  RemediationStatus,
} from "../../../lib/mock-data/compliance-data";

// =============================================================================
// Types
// =============================================================================

export type Tab = "compliance" | "vulnerabilities" | "reports";

// =============================================================================
// Status + Severity Styling
// =============================================================================

export const STATUS_CONFIG: Record<
  ComplianceStatus,
  { bg: string; text: string; icon: typeof Shield }
> = {
  Approved: { bg: "bg-success-bg", text: "text-success-text", icon: ShieldCheck },
  Pending: { bg: "bg-warning-bg", text: "text-warning-text", icon: Clock },
  "In Review": { bg: "bg-info-bg", text: "text-info-text", icon: Shield },
  Deprecated: { bg: "bg-muted", text: "text-muted-foreground", icon: Archive },
  "Non-Compliant": { bg: "bg-danger-bg", text: "text-danger-text", icon: ShieldX },
};

export const SEVERITY_CONFIG: Record<VulnSeverity, { bg: string; text: string; border: string }> = {
  Critical: { bg: "bg-danger-bg", text: "text-danger-text", border: "border-danger-border" },
  High: { bg: "bg-high-bg", text: "text-high-text", border: "border-high-bg" },
  Medium: { bg: "bg-warning-bg", text: "text-warning-text", border: "border-warning-bg" },
  Low: { bg: "bg-info-bg", text: "text-info-text", border: "border-info-bg" },
  Info: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

export const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  Open: "bg-danger-bg text-danger-text",
  "In Progress": "bg-warning-bg text-warning-text",
  Resolved: "bg-success-bg text-success-text",
};

// =============================================================================
// Helper: Role Checks
// =============================================================================

export function canSubmitForReview(role: Role): boolean {
  return canPerformAction(role, "create");
}

export function canApprove(role: Role): boolean {
  return canPerformAction(role, "approve");
}

export function canDeprecate(role: Role): boolean {
  return canPerformAction(role, "approve");
}

export function canCreateVulnerability(role: Role): boolean {
  return canPerformAction(role, "create");
}

export function canUpdateRemediation(role: Role): boolean {
  return canPerformAction(role, "edit");
}

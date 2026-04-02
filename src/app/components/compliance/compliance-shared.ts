import { Shield, ShieldCheck, ShieldX, Clock, Archive } from "lucide-react";
import type { Role } from "../../../lib/rbac";
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
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: ShieldCheck },
  Pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  "In Review": { bg: "bg-blue-50", text: "text-blue-700", icon: Shield },
  Deprecated: { bg: "bg-muted", text: "text-muted-foreground", icon: Archive },
  "Non-Compliant": { bg: "bg-red-50", text: "text-red-700", icon: ShieldX },
};

export const SEVERITY_CONFIG: Record<VulnSeverity, { bg: string; text: string; border: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Info: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

export const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  Open: "bg-red-50 text-red-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

// =============================================================================
// Helper: Role Checks
// =============================================================================

export function canSubmitForReview(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

export function canApprove(role: Role): boolean {
  return role === "Admin";
}

export function canDeprecate(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

export function canCreateVulnerability(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

export function canUpdateRemediation(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

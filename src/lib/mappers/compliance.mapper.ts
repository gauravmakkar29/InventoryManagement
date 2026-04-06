/**
 * Compliance DTO → ViewModel mapper.
 *
 * Bridges canonical Compliance (types.ts) and mock ComplianceItem (compliance-data.ts).
 */

import type { Compliance } from "../types";
import type {
  ComplianceItem,
  ComplianceStatus,
  CertificationType,
} from "../mock-data/compliance-data";

const STATUS_MAP: Record<string, ComplianceStatus> = {
  approved: "Approved",
  pending: "Pending",
  deprecated: "Deprecated",
  non_compliant: "Non-Compliant",
};

/** API response → UI view model */
export function toComplianceViewModel(api: Compliance): ComplianceItem {
  return {
    id: api.id,
    name: api.name,
    certType: api.certificationType as CertificationType,
    status: STATUS_MAP[api.status] ?? "Pending",
    lastAudit: formatDisplayDate(api.lastAuditDate),
    nextAudit: formatDisplayDate(api.nextAuditDate),
    findings: api.findings,
    assignedTo: api.assignedTo,
    vulnerabilityIds: [],
  };
}

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

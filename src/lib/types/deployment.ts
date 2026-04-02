// =============================================================================
// Deployment Domain Types (moved from app/components/deployment/deployment-types.ts)
// =============================================================================

export type Tab = "firmware" | "vulnerabilities" | "reports" | "audit";
export type FirmwareStage = "Uploaded" | "Testing" | "Approved" | "Deprecated";
export type FirmwareStatus = "Active" | "Deprecated" | "Pending";
export type VulnSeverity = "Critical" | "High" | "Medium" | "Low";
export type RemediationStatus = "Open" | "In Progress" | "Resolved";
export type ReportType = "compliance" | "vulnerability" | "approval-chain";

export interface FirmwareEntry {
  id: string;
  version: string;
  name: string;
  stage: FirmwareStage;
  status: FirmwareStatus;
  uploadedBy: string;
  uploadedDate: string;
  testedBy: string | null;
  testedDate: string | null;
  approvedBy: string | null;
  approvedDate: string | null;
  date: string;
  devices: number;
  models: string[];
  releaseNotes: string;
  fileSize: string;
  checksum: string;
}

export type AuditAction = "Created" | "Modified" | "Deleted";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  status: "Success";
}

export interface VulnerabilityEntry {
  id: string;
  cveId: string;
  severity: VulnSeverity;
  affectedComponent: string;
  remediationStatus: RemediationStatus;
  firmwareVersion: string;
  firmwareId: string;
  resolvedDate: string | null;
}

export type SortDirection = "asc" | "desc" | null;
export type AuditSortField =
  | "user"
  | "action"
  | "resourceType"
  | "timestamp"
  | "ipAddress"
  | "status";

export interface ApprovalStageIndicatorProps {
  currentStage: FirmwareStage;
  uploadedBy?: string;
  uploadedDate?: string | null;
  testedBy?: string | null;
  testedDate?: string | null;
  approvedBy?: string | null;
  approvedDate?: string | null;
}

export interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    version: string;
    name: string;
    models: string[];
    releaseNotes: string;
    fileSize: string;
    checksum: string;
  }) => void;
}

import { useState, useMemo, useCallback, useRef } from "react";
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  Package,
  Shield,
  ShieldCheck,
  // ShieldAlert unused — kept for future use
  Clock,
  X,
  AlertTriangle,
  RotateCcw,
  Ban,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Bug,
  FileText,
  Plus,
  Check,
  Filter,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";
import { generateCSV } from "../../lib/report-generator";
import { Skeleton } from "../../components/skeleton";

// =============================================================================
// Types
// =============================================================================

type Tab = "firmware" | "vulnerabilities" | "reports" | "audit";
type FirmwareStage = "Uploaded" | "Testing" | "Approved" | "Deprecated";
type FirmwareStatus = "Active" | "Deprecated" | "Pending";
type VulnSeverity = "Critical" | "High" | "Medium" | "Low";
type RemediationStatus = "Open" | "In Progress" | "Resolved";
type ReportType = "compliance" | "vulnerability" | "approval-chain";

interface FirmwareEntry {
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

type AuditAction = "Created" | "Modified" | "Deleted";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  status: "Success";
}

interface VulnerabilityEntry {
  id: string;
  cveId: string;
  severity: VulnSeverity;
  affectedComponent: string;
  remediationStatus: RemediationStatus;
  firmwareVersion: string;
  firmwareId: string;
  resolvedDate: string | null;
}

// =============================================================================
// Mock Data — Enhanced for Epic 11
// =============================================================================

const INITIAL_FIRMWARE: FirmwareEntry[] = [
  {
    id: "fw-001",
    version: "v4.2.0",
    name: "Critical Security Patch -- CVE-2026-1187",
    stage: "Uploaded",
    status: "Pending",
    uploadedBy: "j.chen@hlm.com",
    uploadedDate: "2026-03-28T14:32:00Z",
    testedBy: null,
    testedDate: null,
    approvedBy: null,
    approvedDate: null,
    date: "Mar 28, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100", "INV-5000"],
    releaseNotes: "Patches remote code execution vulnerability in OTA module.",
    fileSize: "24.8 MB",
    checksum: "a3f8b2c91d4e7f6a0b5c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
  },
  {
    id: "fw-002",
    version: "v4.1.0-rc1",
    name: "Security Patch Bundle",
    stage: "Testing",
    status: "Pending",
    uploadedBy: "j.chen@hlm.com",
    uploadedDate: "2026-03-25T11:20:00Z",
    testedBy: "a.patel@hlm.com",
    testedDate: "2026-03-26T09:00:00Z",
    approvedBy: null,
    approvedDate: null,
    date: "Mar 25, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100"],
    releaseNotes: "Bundle of minor security fixes for Q1 audit compliance.",
    fileSize: "18.2 MB",
    checksum: "b4f9c3d02e5f8a7b1c6d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
  },
  {
    id: "fw-003",
    version: "v4.0.0",
    name: "Major Release -- Q1 2026",
    stage: "Approved",
    status: "Active",
    uploadedBy: "a.patel@hlm.com",
    uploadedDate: "2026-03-05T10:00:00Z",
    testedBy: "j.chen@hlm.com",
    testedDate: "2026-03-07T14:00:00Z",
    approvedBy: "m.rodriguez@hlm.com",
    approvedDate: "2026-03-10T09:30:00Z",
    date: "Mar 10, 2026",
    devices: 1842,
    models: ["INV-3200"],
    releaseNotes: "Full platform update with new telemetry engine.",
    fileSize: "42.1 MB",
    checksum: "c5a0d4e13f6b9c8d2e7f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4",
  },
  {
    id: "fw-004",
    version: "v3.9.2",
    name: "Hotfix -- Telemetry Dropout",
    stage: "Approved",
    status: "Active",
    uploadedBy: "m.rodriguez@hlm.com",
    uploadedDate: "2026-02-25T08:00:00Z",
    testedBy: "a.patel@hlm.com",
    testedDate: "2026-02-26T11:00:00Z",
    approvedBy: "j.chen@hlm.com",
    approvedDate: "2026-02-28T10:00:00Z",
    date: "Feb 28, 2026",
    devices: 3204,
    models: ["INV-3200", "INV-3100"],
    releaseNotes: "Fixes intermittent telemetry dropout under high load.",
    fileSize: "12.7 MB",
    checksum: "d6b1e5f24a7c0d9e3f8a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5",
  },
  {
    id: "fw-005",
    version: "v3.9.1",
    name: "Stability Improvements",
    stage: "Deprecated",
    status: "Deprecated",
    uploadedBy: "a.patel@hlm.com",
    uploadedDate: "2026-02-10T09:00:00Z",
    testedBy: "j.chen@hlm.com",
    testedDate: "2026-02-12T10:00:00Z",
    approvedBy: "m.rodriguez@hlm.com",
    approvedDate: "2026-02-15T14:00:00Z",
    date: "Feb 15, 2026",
    devices: 0,
    models: ["INV-3100"],
    releaseNotes: "General stability improvements. Superseded by v3.9.2.",
    fileSize: "11.3 MB",
    checksum: "e7c2f6a35b8d1e0f4a9b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6",
  },
  {
    id: "fw-006",
    version: "v3.8.0",
    name: "Compliance Module Update",
    stage: "Deprecated",
    status: "Deprecated",
    uploadedBy: "j.chen@hlm.com",
    uploadedDate: "2026-01-15T08:00:00Z",
    testedBy: "m.rodriguez@hlm.com",
    testedDate: "2026-01-17T11:00:00Z",
    approvedBy: "a.patel@hlm.com",
    approvedDate: "2026-01-20T09:00:00Z",
    date: "Jan 20, 2026",
    devices: 0,
    models: ["INV-3200", "INV-5000"],
    releaseNotes: "Updated compliance reporting for NIST 800-53 rev5.",
    fileSize: "28.5 MB",
    checksum: "f8d3a7b46c9e2f1a5b0c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
  },
  {
    id: "fw-007",
    version: "v4.1.1-beta",
    name: "Edge Analytics Preview",
    stage: "Uploaded",
    status: "Pending",
    uploadedBy: "s.kumar@hlm.com",
    uploadedDate: "2026-03-27T16:10:00Z",
    testedBy: null,
    testedDate: null,
    approvedBy: null,
    approvedDate: null,
    date: "Mar 27, 2026",
    devices: 0,
    models: ["INV-5000"],
    releaseNotes: "Beta preview of on-device analytics processing.",
    fileSize: "35.0 MB",
    checksum: "a9e4b8c57d0f3a2b6c1d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
  },
  {
    id: "fw-008",
    version: "v4.0.1",
    name: "OTA Reliability Fix",
    stage: "Testing",
    status: "Pending",
    uploadedBy: "m.rodriguez@hlm.com",
    uploadedDate: "2026-03-20T10:00:00Z",
    testedBy: "j.chen@hlm.com",
    testedDate: "2026-03-22T10:30:00Z",
    approvedBy: null,
    approvedDate: null,
    date: "Mar 22, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100", "INV-5000"],
    releaseNotes: "Improves OTA delivery success rate from 97.2% to 99.8%.",
    fileSize: "15.6 MB",
    checksum: "b0f5c9d68e1a4b3c7d2e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",
  },
];

// Vulnerability mock data — Story 11.4
const INITIAL_VULNERABILITIES: VulnerabilityEntry[] = [
  {
    id: "vuln-001",
    cveId: "CVE-2026-1187",
    severity: "Critical",
    affectedComponent: "OTA Module 2.3.1",
    remediationStatus: "In Progress",
    firmwareVersion: "v4.0.0",
    firmwareId: "fw-003",
    resolvedDate: null,
  },
  {
    id: "vuln-002",
    cveId: "CVE-2026-3917",
    severity: "Critical",
    affectedComponent: "Management API 1.8.0",
    remediationStatus: "Open",
    firmwareVersion: "v3.9.2",
    firmwareId: "fw-004",
    resolvedDate: null,
  },
  {
    id: "vuln-003",
    cveId: "CVE-2026-2205",
    severity: "High",
    affectedComponent: "SNMP Agent 3.2.0",
    remediationStatus: "Open",
    firmwareVersion: "v4.0.0",
    firmwareId: "fw-003",
    resolvedDate: null,
  },
  {
    id: "vuln-004",
    cveId: "CVE-2026-1893",
    severity: "High",
    affectedComponent: "TLS Stack 1.1.4",
    remediationStatus: "Resolved",
    firmwareVersion: "v3.9.2",
    firmwareId: "fw-004",
    resolvedDate: "2026-03-15",
  },
  {
    id: "vuln-005",
    cveId: "CVE-2025-9981",
    severity: "Medium",
    affectedComponent: "Debug Interface 0.9.1",
    remediationStatus: "Resolved",
    firmwareVersion: "v4.1.0-rc1",
    firmwareId: "fw-002",
    resolvedDate: "2026-02-20",
  },
  {
    id: "vuln-006",
    cveId: "CVE-2026-0447",
    severity: "Medium",
    affectedComponent: "Web Dashboard 2.1.0",
    remediationStatus: "Open",
    firmwareVersion: "v4.0.0",
    firmwareId: "fw-003",
    resolvedDate: null,
  },
  {
    id: "vuln-007",
    cveId: "CVE-2025-8834",
    severity: "Low",
    affectedComponent: "MQTT Client 1.5.2",
    remediationStatus: "In Progress",
    firmwareVersion: "v4.0.1",
    firmwareId: "fw-008",
    resolvedDate: null,
  },
  {
    id: "vuln-008",
    cveId: "CVE-2026-0112",
    severity: "Low",
    affectedComponent: "Error Handler 1.0.3",
    remediationStatus: "Open",
    firmwareVersion: "v4.1.1-beta",
    firmwareId: "fw-007",
    resolvedDate: null,
  },
];

// =============================================================================
// Mock Audit Data — Epic 8
// =============================================================================

const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: "aud-01",
    timestamp: "2026-03-28T14:32:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    resourceType: "Firmware",
    resourceId: "FW#fw-001",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-02",
    timestamp: "2026-03-27T16:10:00Z",
    user: "s.kumar@hlm.com",
    action: "Created",
    resourceType: "Firmware",
    resourceId: "FW#fw-007",
    ipAddress: "10.0.12.88",
    status: "Success",
  },
  {
    id: "aud-03",
    timestamp: "2026-03-27T09:15:00Z",
    user: "a.patel@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-003",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-04",
    timestamp: "2026-03-26T16:48:00Z",
    user: "SYSTEM",
    action: "Modified",
    resourceType: "Device",
    resourceId: "DEV#inv-3200-001",
    ipAddress: "lambda-stream",
    status: "Success",
  },
  {
    id: "aud-05",
    timestamp: "2026-03-25T11:20:00Z",
    user: "j.chen@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-002",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-06",
    timestamp: "2026-03-24T08:00:00Z",
    user: "SYSTEM",
    action: "Created",
    resourceType: "Compliance",
    resourceId: "COMP#scan-2026-q1",
    ipAddress: "lambda-stream",
    status: "Success",
  },
  {
    id: "aud-07",
    timestamp: "2026-03-23T14:05:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-005",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-08",
    timestamp: "2026-03-22T10:30:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Created",
    resourceType: "Firmware",
    resourceId: "FW#fw-008",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-09",
    timestamp: "2026-03-21T09:00:00Z",
    user: "a.patel@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-006",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-10",
    timestamp: "2026-03-20T15:45:00Z",
    user: "j.chen@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-006",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-11",
    timestamp: "2026-03-19T11:30:00Z",
    user: "a.patel@hlm.com",
    action: "Created",
    resourceType: "ServiceOrder",
    resourceId: "SO#so-4421",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-12",
    timestamp: "2026-03-18T09:15:00Z",
    user: "j.chen@hlm.com",
    action: "Modified",
    resourceType: "Device",
    resourceId: "DEV#inv-3100-042",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-13",
    timestamp: "2026-03-17T14:22:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Created",
    resourceType: "Device",
    resourceId: "DEV#inv-5000-011",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-14",
    timestamp: "2026-03-16T10:00:00Z",
    user: "SYSTEM",
    action: "Modified",
    resourceType: "Vulnerability",
    resourceId: "VULN#cve-2026-1187",
    ipAddress: "lambda-stream",
    status: "Success",
  },
  {
    id: "aud-15",
    timestamp: "2026-03-15T16:30:00Z",
    user: "s.kumar@hlm.com",
    action: "Modified",
    resourceType: "ServiceOrder",
    resourceId: "SO#so-4418",
    ipAddress: "10.0.12.88",
    status: "Success",
  },
  {
    id: "aud-16",
    timestamp: "2026-03-14T08:45:00Z",
    user: "a.patel@hlm.com",
    action: "Deleted",
    resourceType: "ServiceOrder",
    resourceId: "SO#so-4410",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-17",
    timestamp: "2026-03-13T13:20:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    resourceType: "Firmware",
    resourceId: "FW#fw-009",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-18",
    timestamp: "2026-03-12T11:00:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Modified",
    resourceType: "Device",
    resourceId: "DEV#inv-3200-088",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-19",
    timestamp: "2026-03-11T09:30:00Z",
    user: "SYSTEM",
    action: "Created",
    resourceType: "Compliance",
    resourceId: "COMP#cert-iec62443",
    ipAddress: "lambda-stream",
    status: "Success",
  },
  {
    id: "aud-20",
    timestamp: "2026-03-10T15:15:00Z",
    user: "s.kumar@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-003",
    ipAddress: "10.0.12.88",
    status: "Success",
  },
  {
    id: "aud-21",
    timestamp: "2026-03-09T10:00:00Z",
    user: "a.patel@hlm.com",
    action: "Created",
    resourceType: "ServiceOrder",
    resourceId: "SO#so-4415",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-22",
    timestamp: "2026-03-08T14:40:00Z",
    user: "j.chen@hlm.com",
    action: "Modified",
    resourceType: "Device",
    resourceId: "DEV#inv-3100-019",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-23",
    timestamp: "2026-03-07T11:20:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Deleted",
    resourceType: "Device",
    resourceId: "DEV#inv-2500-003",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-24",
    timestamp: "2026-03-06T08:30:00Z",
    user: "SYSTEM",
    action: "Modified",
    resourceType: "Vulnerability",
    resourceId: "VULN#cve-2026-0988",
    ipAddress: "lambda-stream",
    status: "Success",
  },
  {
    id: "aud-25",
    timestamp: "2026-03-05T16:00:00Z",
    user: "s.kumar@hlm.com",
    action: "Created",
    resourceType: "Device",
    resourceId: "DEV#inv-5000-012",
    ipAddress: "10.0.12.88",
    status: "Success",
  },
  {
    id: "aud-26",
    timestamp: "2026-03-04T09:45:00Z",
    user: "a.patel@hlm.com",
    action: "Modified",
    resourceType: "ServiceOrder",
    resourceId: "SO#so-4412",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-27",
    timestamp: "2026-03-03T13:10:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    resourceType: "Firmware",
    resourceId: "FW#fw-010",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-28",
    timestamp: "2026-03-02T10:30:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Modified",
    resourceType: "Device",
    resourceId: "DEV#inv-3200-055",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-29",
    timestamp: "2026-03-01T08:00:00Z",
    user: "SYSTEM",
    action: "Created",
    resourceType: "Compliance",
    resourceId: "COMP#audit-q1-2026",
    ipAddress: "lambda-stream",
    status: "Success",
  },
  {
    id: "aud-30",
    timestamp: "2026-02-28T15:30:00Z",
    user: "s.kumar@hlm.com",
    action: "Modified",
    resourceType: "Firmware",
    resourceId: "FW#fw-004",
    ipAddress: "10.0.12.88",
    status: "Success",
  },
];

// =============================================================================
// Constants
// =============================================================================

const APPROVAL_STAGES: readonly ("Uploaded" | "Testing" | "Approved")[] = [
  "Uploaded",
  "Testing",
  "Approved",
];
const AUDIT_PAGE_SIZE = 25;
const VULN_PAGE_SIZE = 25;
const AVAILABLE_MODELS = ["INV-3200", "INV-3100", "INV-5000", "INV-4000", "INV-2500"];

const SEVERITY_CONFIG: Record<VulnSeverity, { bg: string; text: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-700" },
  High: { bg: "bg-orange-50", text: "text-orange-700" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700" },
  Low: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  Open: "bg-red-50 text-red-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

// =============================================================================
// Helpers
// =============================================================================

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

type SortDirection = "asc" | "desc" | null;
type AuditSortField = "user" | "action" | "resourceType" | "timestamp" | "ipAddress" | "status";

function getActionBadgeClass(action: AuditAction): string {
  switch (action) {
    case "Created":
      return "bg-blue-500/10 text-blue-600";
    case "Modified":
      return "bg-amber-500/10 text-amber-600";
    case "Deleted":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Compute SHA-256 checksum of a file using Web Crypto API — Story 11.1 */
async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Download a file from generated content — Story 11.6 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// Approval Stage Indicator — Story 11.3
// =============================================================================

interface ApprovalStageIndicatorProps {
  currentStage: FirmwareStage;
  uploadedBy?: string;
  uploadedDate?: string | null;
  testedBy?: string | null;
  testedDate?: string | null;
  approvedBy?: string | null;
  approvedDate?: string | null;
}

function ApprovalStageIndicator({
  currentStage,
  uploadedBy,
  uploadedDate,
  testedBy,
  testedDate,
  approvedBy,
  approvedDate,
}: ApprovalStageIndicatorProps) {
  const isDeprecated = currentStage === "Deprecated";
  const stageIdx = isDeprecated
    ? -1
    : APPROVAL_STAGES.indexOf(currentStage as "Uploaded" | "Testing" | "Approved");

  const stages = [
    { label: "Uploaded", by: uploadedBy, date: uploadedDate },
    { label: "Testing", by: testedBy, date: testedDate },
    { label: "Approved", by: approvedBy, date: approvedDate },
  ];

  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => {
        const isCompleted = !isDeprecated && i < stageIdx;
        const isCurrent = !isDeprecated && i === stageIdx;
        const isFuture = isDeprecated || i > stageIdx;

        const tooltipText =
          (isCompleted || isCurrent) && stage.by
            ? `${stage.label} by ${stage.by}${stage.date ? ` on ${formatShortDate(stage.date)}` : ""}`
            : undefined;

        return (
          <div key={stage.label} className="flex items-center">
            {/* Connector line before circle (skip for first) */}
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 w-4",
                  isCompleted || isCurrent ? "bg-emerald-500" : "bg-gray-200",
                )}
              />
            )}
            {/* Stage circle */}
            <div className="relative group">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold transition-all duration-200",
                  isCompleted && "bg-emerald-500 text-white",
                  isCurrent && "bg-blue-600 text-white animate-pulse",
                  isFuture && "border border-gray-300 bg-white text-gray-400",
                  isDeprecated && "border border-gray-200 bg-gray-100 text-gray-300",
                )}
              >
                {isCompleted ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </div>
              {/* Tooltip on completed/current stages */}
              {tooltipText && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20">
                  <div className="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white shadow-lg">
                    {tooltipText}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* Stage labels below */}
      <div className="ml-2 flex items-center gap-0.5">
        {stages.map((stage, i) => {
          const isCompleted = !isDeprecated && i < stageIdx;
          const isCurrent = !isDeprecated && i === stageIdx;
          return (
            <span
              key={stage.label}
              className={cn(
                "text-[9px] font-medium",
                i > 0 && "ml-1",
                isCompleted && "text-emerald-600",
                isCurrent && "text-blue-600",
                !isCompleted && !isCurrent && "text-gray-400",
                isDeprecated && "text-gray-300 line-through",
              )}
            >
              {i > 0 && <span className="text-gray-300 mr-1">/</span>}
              {stage.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Upload Modal — Stories 11.1 (Checksum + File Upload)
// =============================================================================

interface UploadModalProps {
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

function UploadFirmwareModal({ open, onClose, onSubmit }: UploadModalProps) {
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checksum, setChecksum] = useState<string>("");
  const [computing, setComputing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setComputing(true);
    setChecksum("");
    try {
      const hash = await computeSHA256(file);
      setChecksum(hash);
    } catch {
      toast.error("Failed to compute file checksum");
    } finally {
      setComputing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSubmit = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!version.trim()) newErrors.version = "Version is required";
    if (!name.trim()) newErrors.name = "Name is required";
    if (!selectedFile) newErrors.file = "Firmware file is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const fileSize = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : "0 MB";

      onSubmit({
        version: version.trim(),
        name: name.trim(),
        models,
        releaseNotes: releaseNotes.trim(),
        fileSize,
        checksum,
      });

      // Reset form
      setVersion("");
      setName("");
      setModels([]);
      setReleaseNotes("");
      setSelectedFile(null);
      setChecksum("");
      setErrors({});
      setUploading(false);
      setUploadProgress(0);
    }, 1200);
  }, [version, name, selectedFile, models, releaseNotes, checksum, onSubmit]);

  const toggleModel = (model: string) => {
    setModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Upload Firmware</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Version */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setErrors((prev) => ({ ...prev, version: undefined as unknown as string }));
              }}
              placeholder="e.g. v4.3.0"
              className={cn(
                "w-full rounded-sm border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]",
                errors.version ? "border-red-500" : "border-border",
              )}
            />
            {errors.version && <p className="mt-0.5 text-[10px] text-red-500">{errors.version}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined as unknown as string }));
              }}
              placeholder="e.g. Security Patch Bundle"
              className={cn(
                "w-full rounded-sm border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]",
                errors.name ? "border-red-500" : "border-border",
              )}
            />
            {errors.name && <p className="mt-0.5 text-[10px] text-red-500">{errors.name}</p>}
          </div>

          {/* Device Model */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Compatible Models
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModel(model)}
                  className={cn(
                    "rounded-sm border px-2 py-1 text-[10px] font-medium transition-colors duration-150",
                    models.includes(model)
                      ? "border-[#FF7900] bg-[#FF7900]/10 text-[#FF7900]"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Release Notes
            </label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={2}
              placeholder="Describe the changes in this firmware version..."
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
            />
          </div>

          {/* File Upload — Story 11.1 AC1/AC2 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Firmware File <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-sm border border-dashed px-3 py-3 cursor-pointer transition-colors duration-150",
                isDragging
                  ? "border-[#FF7900] bg-[#FF7900]/5"
                  : errors.file
                    ? "border-red-400 bg-red-50/30"
                    : "border-border bg-muted/30 hover:border-[#FF7900]/50",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept=".bin,.fw,.img,.hex,.zip"
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 text-[11px]">
                  <Package className="h-4 w-4 text-[#FF7900]" />
                  <span className="font-medium text-foreground">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    Drag & drop or click to select (.bin, .fw, .img)
                  </span>
                </div>
              )}
            </div>
            {errors.file && <p className="mt-0.5 text-[10px] text-red-500">{errors.file}</p>}
          </div>

          {/* Checksum Display — Story 11.1 AC2 */}
          {(computing || checksum) && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                SHA-256 Checksum
              </label>
              {computing ? (
                <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/50 px-2.5 py-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Computing checksum...</span>
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={checksum}
                  className="w-full rounded-sm border border-border bg-muted/30 px-2.5 py-1.5 font-mono text-[10px] text-foreground"
                />
              )}
            </div>
          )}

          {/* Upload Progress — Story 11.1 */}
          {uploading && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Uploading...</span>
                <span className="text-[10px] font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#FF7900] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-sm bg-[#FF7900] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Create Vulnerability Modal — Story 11.5
// =============================================================================

function CreateVulnerabilityModal({
  firmwareList,
  onClose,
  onSubmit,
}: {
  firmwareList: FirmwareEntry[];
  onClose: () => void;
  onSubmit: (data: Omit<VulnerabilityEntry, "id" | "resolvedDate">) => void;
}) {
  const [cveId, setCveId] = useState("");
  const [severity, setSeverity] = useState<VulnSeverity | "">("");
  const [affectedComponent, setAffectedComponent] = useState("");
  const [firmwareId, setFirmwareId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!cveId.trim()) newErrors.cveId = "CVE ID is required";
    if (!severity) newErrors.severity = "Severity is required";
    if (!affectedComponent.trim()) newErrors.affectedComponent = "Affected component is required";
    if (!firmwareId) newErrors.firmwareId = "Firmware is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fw = firmwareList.find((f) => f.id === firmwareId);
    onSubmit({
      cveId: cveId.trim(),
      severity: severity as VulnSeverity,
      affectedComponent: affectedComponent.trim(),
      remediationStatus: "Open",
      firmwareVersion: fw?.version ?? "",
      firmwareId,
    });
    onClose();
  };

  const inputClass =
    "w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-sm border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-bold text-foreground">Add Vulnerability</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              CVE ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cveId}
              onChange={(e) => {
                setCveId(e.target.value);
                setErrors((p) => ({ ...p, cveId: "" }));
              }}
              placeholder="CVE-2026-XXXX"
              className={cn(inputClass, errors.cveId && "border-red-500")}
            />
            {errors.cveId && <p className="mt-0.5 text-[10px] text-red-500">{errors.cveId}</p>}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Severity <span className="text-red-500">*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value as VulnSeverity);
                setErrors((p) => ({ ...p, severity: "" }));
              }}
              className={cn(inputClass, errors.severity && "border-red-500")}
            >
              <option value="">Select severity</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.severity && (
              <p className="mt-0.5 text-[10px] text-red-500">{errors.severity}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Affected Component <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={affectedComponent}
              onChange={(e) => {
                setAffectedComponent(e.target.value);
                setErrors((p) => ({ ...p, affectedComponent: "" }));
              }}
              placeholder="e.g. OpenSSL 3.1.0"
              className={cn(inputClass, errors.affectedComponent && "border-red-500")}
            />
            {errors.affectedComponent && (
              <p className="mt-0.5 text-[10px] text-red-500">{errors.affectedComponent}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Linked Firmware <span className="text-red-500">*</span>
            </label>
            <select
              value={firmwareId}
              onChange={(e) => {
                setFirmwareId(e.target.value);
                setErrors((p) => ({ ...p, firmwareId: "" }));
              }}
              className={cn(inputClass, errors.firmwareId && "border-red-500")}
            >
              <option value="">Select firmware</option>
              {firmwareList.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.version} - {fw.name}
                </option>
              ))}
            </select>
            {errors.firmwareId && (
              <p className="mt-0.5 text-[10px] text-red-500">{errors.firmwareId}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-sm bg-[#FF7900] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90"
          >
            Create Vulnerability
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Deployment Component
// =============================================================================

export function Deployment() {
  const { groups, email } = useAuth();
  const role = getPrimaryRole(groups);
  const canManage = canPerformAction(role, "approve");
  const isAdmin = role === "Admin";
  const canViewAudit = role === "Admin" || role === "Manager";
  const canManageVulns = role === "Admin" || role === "Manager";

  const [activeTab, setActiveTab] = useState<Tab>("firmware");
  const [firmware, setFirmware] = useState<FirmwareEntry[]>(INITIAL_FIRMWARE);
  const [vulnerabilities, setVulnerabilities] =
    useState<VulnerabilityEntry[]>(INITIAL_VULNERABILITIES);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [vulnModalOpen, setVulnModalOpen] = useState(false);

  // Firmware filters — Story 11.7
  const [fwStatusFilter, setFwStatusFilter] = useState<FirmwareStatus | "All">("All");
  const [fwModelFilter, setFwModelFilter] = useState<string>("All");

  // Vulnerability filters — Story 11.4
  const [vulnSeverityFilter, setVulnSeverityFilter] = useState<VulnSeverity | "All">("All");
  const [vulnPage, setVulnPage] = useState(1);

  // Regulatory Reports — Story 11.6
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("compliance");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);

  // Audit state — Epic 8
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [auditStartDate, setAuditStartDate] = useState(defaultRange.start);
  const [auditEndDate, setAuditEndDate] = useState(defaultRange.end);
  const [auditDateError, setAuditDateError] = useState("");
  const [auditUserFilter, setAuditUserFilter] = useState("");
  const [auditUserInput, setAuditUserInput] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditSortField, setAuditSortField] = useState<AuditSortField>("timestamp");
  const [auditSortDir, setAuditSortDir] = useState<SortDirection>("desc");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const currentUser = email ?? "admin@hlm.com";

  const addAuditEntry = useCallback(
    (action: AuditAction, resourceType: string, resourceId: string) => {
      const entry: AuditEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUser,
        action,
        resourceType,
        resourceId,
        ipAddress: "10.0.12.45",
        status: "Success",
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    [currentUser],
  );

  // ---------------------------------------------------------------------------
  // Story 11.1 — Upload Firmware with Checksum
  // ---------------------------------------------------------------------------

  const handleUpload = useCallback(
    (data: {
      version: string;
      name: string;
      models: string[];
      releaseNotes: string;
      fileSize: string;
      checksum: string;
    }) => {
      const newEntry: FirmwareEntry = {
        id: `fw-${Date.now()}`,
        version: data.version,
        name: data.name,
        stage: "Uploaded",
        status: "Pending",
        uploadedBy: currentUser,
        uploadedDate: new Date().toISOString(),
        testedBy: null,
        testedDate: null,
        approvedBy: null,
        approvedDate: null,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        devices: 0,
        models: data.models.length > 0 ? data.models : ["INV-3200"],
        releaseNotes: data.releaseNotes,
        fileSize: data.fileSize,
        checksum: data.checksum,
      };
      setFirmware((prev) => [newEntry, ...prev]);
      addAuditEntry("Created", "Firmware", `FW#${newEntry.id}`);
      toast.success(`Firmware ${data.version} uploaded successfully`);
      setUploadModalOpen(false);
    },
    [currentUser, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 11.2 — Multi-Stage Approval with SoD
  // ---------------------------------------------------------------------------

  const advanceStage = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;

      if (fw.stage === "Uploaded") {
        // SoD: Uploader cannot advance to Testing
        if (fw.uploadedBy === currentUser) {
          toast.error("Separation of Duties: The uploader cannot advance to Testing");
          return;
        }
        const confirmed = window.confirm(
          `Are you sure you want to advance ${fw.version} to Testing?`,
        );
        if (!confirmed) return;

        setFirmware((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  stage: "Testing" as FirmwareStage,
                  testedBy: currentUser,
                  testedDate: new Date().toISOString(),
                }
              : f,
          ),
        );
        addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
        toast.success(`${fw.version} advanced to Testing`);
      } else if (fw.stage === "Testing") {
        // SoD: Tester cannot approve
        if (fw.testedBy === currentUser) {
          toast.error("Separation of Duties: The tester cannot approve");
          return;
        }
        const confirmed = window.confirm(
          `Are you sure you want to advance ${fw.version} to Approved?`,
        );
        if (!confirmed) return;

        setFirmware((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  stage: "Approved" as FirmwareStage,
                  status: "Active" as FirmwareStatus,
                  approvedBy: currentUser,
                  approvedDate: new Date().toISOString(),
                }
              : f,
          ),
        );
        addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
        toast.success(`${fw.version} approved`);
      }
    },
    [firmware, currentUser, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 11.7 — Deprecate / Activate
  // ---------------------------------------------------------------------------

  const deprecateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      const confirmed = window.confirm(`Deprecate firmware ${fw.version}?`);
      if (!confirmed) return;

      setFirmware((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                stage: "Deprecated" as FirmwareStage,
                status: "Deprecated" as FirmwareStatus,
                devices: 0,
              }
            : f,
        ),
      );
      addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
      toast.success(`${fw.version} deprecated`);
    },
    [firmware, addAuditEntry],
  );

  const activateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      const confirmed = window.confirm(
        `Reactivate firmware ${fw.version}? It will return to Uploaded stage.`,
      );
      if (!confirmed) return;

      setFirmware((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, stage: "Uploaded" as FirmwareStage, status: "Pending" as FirmwareStatus }
            : f,
        ),
      );
      addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
      toast.success(`${fw.version} reactivated`);
    },
    [firmware, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 11.5 — Vulnerability Remediation
  // ---------------------------------------------------------------------------

  const handleCreateVulnerability = useCallback(
    (data: Omit<VulnerabilityEntry, "id" | "resolvedDate">) => {
      const newVuln: VulnerabilityEntry = {
        ...data,
        id: `vuln-${Date.now()}`,
        resolvedDate: null,
      };
      setVulnerabilities((prev) => [newVuln, ...prev]);
      addAuditEntry("Created", "Vulnerability", `VULN#${newVuln.id}`);
      toast.success("Vulnerability record created");
    },
    [addAuditEntry],
  );

  const handleRemediationChange = useCallback(
    (vulnId: string, newStatus: RemediationStatus) => {
      const resolvedDate =
        newStatus === "Resolved" ? (new Date().toISOString().split("T")[0] ?? null) : null;
      setVulnerabilities((prev) =>
        prev.map((v) =>
          v.id === vulnId ? { ...v, remediationStatus: newStatus, resolvedDate } : v,
        ),
      );
      addAuditEntry("Modified", "Vulnerability", `VULN#${vulnId}`);
      toast.success(`Vulnerability status updated to ${newStatus}`);
    },
    [addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 11.7 — Filtered Firmware
  // ---------------------------------------------------------------------------

  const filteredFirmware = useMemo(() => {
    let items = firmware;
    if (fwStatusFilter !== "All") {
      items = items.filter((fw) => fw.status === fwStatusFilter);
    }
    if (fwModelFilter !== "All") {
      items = items.filter((fw) => fw.models.includes(fwModelFilter));
    }
    return items;
  }, [firmware, fwStatusFilter, fwModelFilter]);

  // ---------------------------------------------------------------------------
  // Story 11.4 — Filtered Vulnerabilities
  // ---------------------------------------------------------------------------

  const filteredVulnerabilities = useMemo(() => {
    let items = vulnerabilities;
    if (vulnSeverityFilter !== "All") {
      items = items.filter((v) => v.severity === vulnSeverityFilter);
    }
    // Sort by severity order: Critical > High > Medium > Low
    const severityOrder: Record<VulnSeverity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    items = [...items].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    return items;
  }, [vulnerabilities, vulnSeverityFilter]);

  const totalVulnPages = Math.max(1, Math.ceil(filteredVulnerabilities.length / VULN_PAGE_SIZE));
  const paginatedVulnerabilities = useMemo(() => {
    const start = (vulnPage - 1) * VULN_PAGE_SIZE;
    return filteredVulnerabilities.slice(start, start + VULN_PAGE_SIZE);
  }, [filteredVulnerabilities, vulnPage]);

  // ---------------------------------------------------------------------------
  // Story 11.6 — Report Generation
  // ---------------------------------------------------------------------------

  const generateReport = useCallback(() => {
    let data: Record<string, unknown>[] = [];

    if (selectedReportType === "compliance") {
      // Compliance summary from firmware + status
      data = firmware.map((fw) => ({
        "Firmware ID": fw.id,
        Version: fw.version,
        Name: fw.name,
        Status: fw.status,
        "Approval Stage": fw.stage,
        "Device Model": fw.models.join(", "),
        "Uploaded By": fw.uploadedBy,
        "Upload Date": fw.uploadedDate,
        Checksum: fw.checksum,
      }));
    } else if (selectedReportType === "vulnerability") {
      data = vulnerabilities.map((v) => ({
        "CVE ID": v.cveId,
        Severity: v.severity,
        "Affected Component": v.affectedComponent,
        "Remediation Status": v.remediationStatus,
        "Firmware Version": v.firmwareVersion,
        "Resolved Date": v.resolvedDate ?? "N/A",
      }));
    } else if (selectedReportType === "approval-chain") {
      data = firmware.map((fw) => ({
        "Firmware ID": fw.id,
        Version: fw.version,
        Name: fw.name,
        "Uploaded By": fw.uploadedBy,
        "Upload Date": fw.uploadedDate ? formatTimestamp(fw.uploadedDate) : "N/A",
        "Tested By": fw.testedBy ?? "N/A",
        "Tested Date": fw.testedDate ? formatTimestamp(fw.testedDate) : "N/A",
        "Approved By": fw.approvedBy ?? "N/A",
        "Approved Date": fw.approvedDate ? formatTimestamp(fw.approvedDate) : "N/A",
      }));
    }

    setReportData(data);
    setReportGenerated(true);
  }, [selectedReportType, firmware, vulnerabilities]);

  const exportReport = useCallback(
    (format: "csv" | "json") => {
      if (reportData.length === 0) return;
      const date = new Date().toISOString().split("T")[0];
      const filename = `${selectedReportType}-report-${date}`;

      if (format === "csv") {
        const csv = generateCSV(reportData);
        downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
      } else {
        const json = JSON.stringify(reportData, null, 2);
        downloadFile(json, `${filename}.json`, "application/json");
      }
      toast.success(`${selectedReportType} report exported as ${format.toUpperCase()}`);
    },
    [reportData, selectedReportType],
  );

  // ---------------------------------------------------------------------------
  // Audit — Epic 8
  // ---------------------------------------------------------------------------

  const filteredAudit = useMemo(() => {
    let entries = auditLog;
    if (auditStartDate && auditEndDate) {
      const startISO = new Date(auditStartDate + "T00:00:00Z").toISOString();
      const endISO = new Date(auditEndDate + "T23:59:59Z").toISOString();
      entries = entries.filter((e) => e.timestamp >= startISO && e.timestamp <= endISO);
    }
    if (auditUserFilter.trim()) {
      const q = auditUserFilter.toLowerCase();
      entries = entries.filter((e) => e.user.toLowerCase().includes(q));
    }
    return entries;
  }, [auditLog, auditStartDate, auditEndDate, auditUserFilter]);

  const sortedAudit = useMemo(() => {
    if (!auditSortField || !auditSortDir) return filteredAudit;
    return [...filteredAudit].sort((a, b) => {
      const aVal = a[auditSortField];
      const bVal = b[auditSortField];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return auditSortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredAudit, auditSortField, auditSortDir]);

  const totalAuditPages = Math.max(1, Math.ceil(sortedAudit.length / AUDIT_PAGE_SIZE));
  const paginatedAudit = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return sortedAudit.slice(start, start + AUDIT_PAGE_SIZE);
  }, [sortedAudit, auditPage]);

  const handleApplyDateRange = useCallback(() => {
    if (auditStartDate && auditEndDate && auditEndDate < auditStartDate) {
      setAuditDateError("End date must be after start date");
      return;
    }
    setAuditDateError("");
    setAuditPage(1);
    setAuditLoading(true);
    setAuditError(null);
    setTimeout(() => setAuditLoading(false), 300);
  }, [auditStartDate, auditEndDate]);

  const handleApplyUserFilter = useCallback(() => {
    setAuditUserFilter(auditUserInput);
    setAuditPage(1);
  }, [auditUserInput]);

  const handleClearUserFilter = useCallback(() => {
    setAuditUserInput("");
    setAuditUserFilter("");
    setAuditPage(1);
  }, []);

  const handleSort = useCallback(
    (field: AuditSortField) => {
      setAuditSortField((prev) => {
        if (prev !== field) return field;
        return prev;
      });
      setAuditSortDir((prev) => {
        if (auditSortField !== field) return "asc";
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    },
    [auditSortField],
  );

  const handleRetryAudit = useCallback(() => {
    setAuditError(null);
    setAuditLoading(true);
    setTimeout(() => setAuditLoading(false), 300);
  }, []);

  const exportAuditCsv = useCallback(() => {
    if (sortedAudit.length === 0) return;
    const data = sortedAudit.map((e) => ({
      User: e.user,
      Action: e.action,
      ResourceType: e.resourceType,
      ResourceId: e.resourceId,
      Timestamp: e.timestamp,
      IPAddress: e.ipAddress,
      Status: e.status,
    }));
    const csv = generateCSV(
      data,
      ["User", "Action", "ResourceType", "ResourceId", "Timestamp", "IPAddress", "Status"],
      ["User", "Action", "ResourceType", "ResourceId", "Timestamp", "IPAddress", "Status"],
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${auditStartDate}-to-${auditEndDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported successfully");
  }, [sortedAudit, auditStartDate, auditEndDate]);

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  const TABS: { id: Tab; label: string; icon: typeof Shield; visible: boolean }[] = [
    { id: "firmware", label: "Firmware", icon: Package, visible: true },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug, visible: true },
    { id: "reports", label: "Regulatory Reports", icon: FileText, visible: true },
    { id: "audit", label: "Audit Log", icon: Clock, visible: canViewAudit },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Tabs + Upload Button */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-border">
          {TABS.filter((t) => t.visible).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors duration-150",
                activeTab === tab.id
                  ? "border-b-2 border-[#FF7900] text-[#FF7900]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "firmware" && canManage && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1 rounded-sm bg-[#FF7900] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90 transition-colors duration-150"
          >
            <Upload className="h-3 w-3" />
            Upload Firmware
          </button>
        )}
        {activeTab === "vulnerabilities" && canManageVulns && (
          <button
            onClick={() => setVulnModalOpen(true)}
            className="flex items-center gap-1 rounded-sm bg-[#FF7900] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90 transition-colors duration-150"
          >
            <Plus className="h-3 w-3" />
            Add Vulnerability
          </button>
        )}
      </div>

      {/* ===== Firmware Tab — Stories 11.1, 11.2, 11.3, 11.7 ===== */}
      {activeTab === "firmware" && (
        <>
          {/* Filters — Story 11.7 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status filter pills */}
            <div className="flex items-center gap-1.5">
              {(["All", "Active", "Pending", "Deprecated"] as const).map((s) => {
                const count =
                  s === "All" ? firmware.length : firmware.filter((fw) => fw.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setFwStatusFilter(s);
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors duration-150",
                      fwStatusFilter === s
                        ? "bg-[#FF7900] text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {s} ({count})
                  </button>
                );
              })}
            </div>

            {/* Model filter dropdown */}
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={fwModelFilter}
                onChange={(e) => setFwModelFilter(e.target.value)}
                className="appearance-none rounded-sm border border-border bg-background py-1 pl-6 pr-7 text-[10px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
              >
                <option value="All">All Models</option>
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {filteredFirmware.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-gray-50 py-16">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {firmware.length === 0
                  ? "No firmware packages found"
                  : "No firmware found matching the selected filters"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {firmware.length === 0
                  ? "Upload your first firmware package to get started."
                  : "Try adjusting your filters."}
              </p>
              {firmware.length === 0 && canManage && (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="mt-4 flex items-center gap-1 rounded-sm bg-[#FF7900] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90"
                >
                  <Upload className="h-3 w-3" />
                  Upload Firmware
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredFirmware.map((fw) => {
                const isDeprecated = fw.stage === "Deprecated";
                const isUploadedByCurrentUser = fw.uploadedBy === currentUser;
                const isTestedByCurrentUser = fw.testedBy === currentUser;

                // SoD-aware button visibility — Story 11.2
                const canAdvanceToTesting =
                  canManage && fw.stage === "Uploaded" && !isUploadedByCurrentUser;
                const canApprove = canManage && fw.stage === "Testing" && !isTestedByCurrentUser;
                const showSoDWarningUploaded =
                  canManage && fw.stage === "Uploaded" && isUploadedByCurrentUser;
                const showSoDWarningTesting =
                  canManage && fw.stage === "Testing" && isTestedByCurrentUser;
                const canDeprecate = canManage && fw.status === "Active";
                const canActivate = isAdmin && isDeprecated;

                // Status badge — Story 11.7
                const statusBadge = (() => {
                  switch (fw.status) {
                    case "Active":
                      return "bg-emerald-500/10 text-emerald-600";
                    case "Deprecated":
                      return "bg-gray-200 text-gray-500";
                    case "Pending":
                      return "bg-amber-500/10 text-amber-600";
                  }
                })();

                return (
                  <div
                    key={fw.id}
                    className={cn(
                      "rounded-sm border bg-card p-3 space-y-2.5 transition-all duration-150 hover:shadow-md",
                      isDeprecated ? "border-border/50 opacity-60" : "border-border",
                    )}
                  >
                    {/* Header: version + status badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isDeprecated ? "text-muted-foreground line-through" : "text-foreground",
                        )}
                      >
                        {fw.version}
                      </span>
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                          statusBadge,
                        )}
                      >
                        {fw.status}
                      </span>
                    </div>

                    {/* Name */}
                    <p className="text-xs text-muted-foreground">{fw.name}</p>

                    {/* Approval Stage Indicator — Story 11.3 */}
                    <ApprovalStageIndicator
                      currentStage={fw.stage}
                      uploadedBy={fw.uploadedBy}
                      uploadedDate={fw.uploadedDate}
                      testedBy={fw.testedBy}
                      testedDate={fw.testedDate}
                      approvedBy={fw.approvedBy}
                      approvedDate={fw.approvedDate}
                    />

                    {/* Metadata — Story 11.7 */}
                    <div className="space-y-1 text-[10px] text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>
                          Model: <span className="text-foreground">{fw.models.join(", ")}</span>
                        </span>
                        <span>
                          Size: <span className="text-foreground">{fw.fileSize}</span>
                        </span>
                      </div>
                      <p>
                        Uploaded by: <span className="text-foreground">{fw.uploadedBy}</span>
                      </p>
                      <p>
                        Date: <span className="text-foreground">{fw.date}</span>
                      </p>
                      <p>
                        Deployed to:{" "}
                        <span className="font-medium text-foreground">
                          {fw.devices.toLocaleString()} devices
                        </span>
                      </p>
                    </div>

                    {/* Action buttons — Stories 11.2, 11.7 */}
                    {(canAdvanceToTesting ||
                      canApprove ||
                      showSoDWarningUploaded ||
                      showSoDWarningTesting ||
                      canDeprecate ||
                      canActivate) && (
                      <div className="flex items-center gap-1.5 border-t border-border pt-2 flex-wrap">
                        {canAdvanceToTesting && (
                          <button
                            onClick={() => advanceStage(fw.id)}
                            className="flex items-center gap-1 rounded-sm bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700 transition-colors duration-150"
                          >
                            <Shield className="h-2.5 w-2.5" />
                            Advance to Testing
                          </button>
                        )}
                        {canApprove && (
                          <button
                            onClick={() => advanceStage(fw.id)}
                            className="flex items-center gap-1 rounded-sm bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700 transition-colors duration-150"
                          >
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Approve
                          </button>
                        )}
                        {showSoDWarningUploaded && (
                          <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Requires different tester
                          </span>
                        )}
                        {showSoDWarningTesting && (
                          <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Requires different approver
                          </span>
                        )}
                        {canDeprecate && (
                          <button
                            onClick={() => deprecateFirmware(fw.id)}
                            className="flex items-center gap-1 rounded-sm border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            Deprecate
                          </button>
                        )}
                        {canActivate && (
                          <button
                            onClick={() => activateFirmware(fw.id)}
                            className="flex items-center gap-1 rounded-sm border border-emerald-200 px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors duration-150"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            Activate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== Vulnerabilities Tab — Stories 11.4, 11.5 ===== */}
      {activeTab === "vulnerabilities" && (
        <div className="space-y-3">
          {/* Severity filter pills — Story 11.4 AC3 */}
          <div className="flex items-center gap-1.5">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map((s) => {
              const count =
                s === "All"
                  ? vulnerabilities.length
                  : vulnerabilities.filter((v) => v.severity === s).length;
              const pillColor =
                s === "All"
                  ? fwStatusFilter === s // always active style logic
                    ? ""
                    : ""
                  : s === "Critical"
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : s === "High"
                      ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                      : s === "Medium"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

              return (
                <button
                  key={s}
                  onClick={() => {
                    setVulnSeverityFilter(s);
                    setVulnPage(1);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors duration-150",
                    vulnSeverityFilter === s
                      ? "bg-[#FF7900] text-white"
                      : s === "All"
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : pillColor,
                  )}
                >
                  {s} ({count})
                </button>
              );
            })}
          </div>

          {/* Vulnerability Table — Story 11.4 */}
          <div className="overflow-auto rounded-sm border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    CVE ID
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Affected Component
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Remediation Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Firmware Version
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedVulnerabilities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Bug className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No vulnerabilities found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedVulnerabilities.map((vuln) => {
                    const sevCfg = SEVERITY_CONFIG[vuln.severity];
                    return (
                      <tr
                        key={vuln.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors duration-150"
                      >
                        <td className="px-3 py-2.5 font-mono text-[11px] font-medium text-foreground">
                          {vuln.cveId}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              sevCfg.bg,
                              sevCfg.text,
                            )}
                          >
                            {vuln.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {vuln.affectedComponent}
                        </td>
                        <td className="px-3 py-2.5">
                          {/* Story 11.5 — Inline status dropdown for Admin/Manager, badge for Viewer */}
                          {canManageVulns ? (
                            <select
                              value={vuln.remediationStatus}
                              onChange={(e) =>
                                handleRemediationChange(
                                  vuln.id,
                                  e.target.value as RemediationStatus,
                                )
                              }
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FF7900]",
                                REMEDIATION_STYLES[vuln.remediationStatus],
                              )}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          ) : (
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-medium",
                                REMEDIATION_STYLES[vuln.remediationStatus],
                              )}
                            >
                              {vuln.remediationStatus}
                            </span>
                          )}
                          {vuln.resolvedDate && (
                            <span className="ml-1.5 text-[9px] text-muted-foreground">
                              ({vuln.resolvedDate})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {vuln.firmwareVersion}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredVulnerabilities.length > VULN_PAGE_SIZE && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing{" "}
                {Math.min((vulnPage - 1) * VULN_PAGE_SIZE + 1, filteredVulnerabilities.length)}
                {" - "}
                {Math.min(vulnPage * VULN_PAGE_SIZE, filteredVulnerabilities.length)} of{" "}
                {filteredVulnerabilities.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVulnPage((p) => Math.max(1, p - 1))}
                  disabled={vulnPage <= 1}
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setVulnPage((p) => Math.min(totalVulnPages, p + 1))}
                  disabled={vulnPage >= totalVulnPages}
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Regulatory Reports Tab — Story 11.6 ===== */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Report Type Selector */}
          <div className="flex items-center gap-4">
            <label className="text-[11px] font-medium text-muted-foreground">Report Type:</label>
            <div className="flex items-center gap-3">
              {[
                { id: "compliance" as const, label: "Compliance Summary" },
                { id: "vulnerability" as const, label: "Vulnerability Report" },
                { id: "approval-chain" as const, label: "Approval Chain Audit" },
              ].map((rt) => (
                <label key={rt.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value={rt.id}
                    checked={selectedReportType === rt.id}
                    onChange={() => {
                      setSelectedReportType(rt.id);
                      setReportGenerated(false);
                      setReportData([]);
                    }}
                    className="accent-[#FF7900] h-3 w-3"
                  />
                  <span className="text-xs text-foreground">{rt.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={generateReport}
              className="flex items-center gap-1.5 rounded-sm bg-[#FF7900] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90 transition-colors duration-150"
            >
              <FileText className="h-3 w-3" />
              Generate
            </button>
          </div>

          {/* Export buttons */}
          {reportGenerated && reportData.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportReport("csv")}
                className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
              <button
                onClick={() => exportReport("json")}
                className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <Download className="h-3 w-3" />
                Export JSON
              </button>
              <span className="text-[10px] text-muted-foreground ml-2">
                {reportData.length} records generated
              </span>
            </div>
          )}

          {/* Report Preview Table */}
          {reportGenerated && (
            <div
              className="overflow-auto rounded-sm border border-border"
              style={{ maxHeight: "calc(100vh - 340px)" }}
            >
              {reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No data available for this report type
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="border-b-2 border-border bg-muted/50">
                      {Object.keys(reportData[0] ?? {}).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors duration-150"
                      >
                        {Object.values(row).map((val, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[200px] truncate"
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {!reportGenerated && (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 py-16">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Select a report type and click Generate
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Reports can be exported as CSV or JSON
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== Audit Log Tab — Epic 8 ===== */}
      {activeTab === "audit" && canViewAudit && (
        <div className="space-y-3">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Date Range */}
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  From
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={auditStartDate}
                    onChange={(e) => {
                      setAuditStartDate(e.target.value);
                      setAuditDateError("");
                    }}
                    className="rounded-sm border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  To
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={auditEndDate}
                    onChange={(e) => {
                      setAuditEndDate(e.target.value);
                      setAuditDateError("");
                    }}
                    className="rounded-sm border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyDateRange}
                className="rounded-sm bg-[#FF7900] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FF7900]/90 transition-colors duration-150"
              >
                Apply
              </button>
            </div>

            {/* User Filter */}
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Filter by User
                </label>
                <div className="relative">
                  <User className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={auditUserInput}
                    onChange={(e) => setAuditUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyUserFilter();
                    }}
                    placeholder="User ID or email"
                    className="rounded-sm border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900] w-48"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyUserFilter}
                className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors duration-150"
              >
                <Search className="h-3 w-3" />
              </button>
              {auditUserFilter && (
                <button
                  onClick={handleClearUserFilter}
                  className="flex items-center gap-1 rounded-sm bg-blue-500/10 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/20 transition-colors duration-150"
                >
                  {auditUserFilter}
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex-1" />

            {/* Export CSV */}
            <button
              onClick={exportAuditCsv}
              disabled={sortedAudit.length === 0}
              className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>

          {auditDateError && <p className="text-xs text-red-500">{auditDateError}</p>}

          {auditError && (
            <div className="flex flex-col items-center justify-center rounded-sm border border-red-200 bg-red-50 py-8">
              <AlertTriangle className="mb-2 h-6 w-6 text-red-500" />
              <p className="text-sm font-medium text-red-600">Failed to load audit logs</p>
              <p className="mt-1 text-xs text-red-500">{auditError}</p>
              <button
                onClick={handleRetryAudit}
                className="mt-3 flex items-center gap-1 rounded-sm border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors duration-150"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          {!auditError && (
            <div
              className="overflow-auto rounded-sm border border-border"
              style={{ maxHeight: "calc(100vh - 320px)" }}
            >
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/50">
                    {[
                      { field: "user" as const, label: "User" },
                      { field: "action" as const, label: "Action" },
                      { field: "resourceType" as const, label: "Resource Type" },
                      { field: "timestamp" as const, label: "Timestamp" },
                      { field: "ipAddress" as const, label: "IP Address" },
                      { field: "status" as const, label: "Status" },
                    ].map(({ field, label }) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors duration-150"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {auditSortField === field && auditSortDir === "asc" && (
                            <ArrowUp className="h-3 w-3" />
                          )}
                          {auditSortField === field && auditSortDir === "desc" && (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {(auditSortField !== field || !auditSortDir) && (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skel-${i}`} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-36" />
                        </td>
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-14" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedAudit.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        {auditUserFilter
                          ? "No audit entries found for this user"
                          : "No audit entries found for the selected date range"}
                      </td>
                    </tr>
                  ) : (
                    paginatedAudit.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 text-muted-foreground">{log.user}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                              getActionBadgeClass(log.action),
                            )}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {log.resourceType}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {log.ipAddress}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!auditError && !auditLoading && sortedAudit.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {Math.min((auditPage - 1) * AUDIT_PAGE_SIZE + 1, sortedAudit.length)}
                {" - "}
                {Math.min(auditPage * AUDIT_PAGE_SIZE, sortedAudit.length)} of {sortedAudit.length}{" "}
                entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage >= totalAuditPages}
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal — Story 11.1 */}
      <UploadFirmwareModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleUpload}
      />

      {/* Create Vulnerability Modal — Story 11.5 */}
      {vulnModalOpen && (
        <CreateVulnerabilityModal
          firmwareList={firmware}
          onClose={() => setVulnModalOpen(false)}
          onSubmit={handleCreateVulnerability}
        />
      )}
    </div>
  );
}

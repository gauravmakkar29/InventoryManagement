import { useState, useMemo, useCallback } from "react";
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  Package,
  Shield,
  ShieldCheck,
  ShieldAlert,
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

type Tab = "firmware" | "audit";
type FirmwareStage = "Uploaded" | "Testing" | "Approved" | "Deprecated";

interface FirmwareEntry {
  id: string;
  version: string;
  name: string;
  stage: FirmwareStage;
  uploadedBy: string;
  date: string;
  devices: number;
  models: string[];
  releaseNotes: string;
}

type AuditAction = "Created" | "Modified" | "Deleted";

interface AuditEntry {
  id: string;
  timestamp: string; // ISO8601
  user: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  status: "Success";
}

// =============================================================================
// Mock Data — Story 4.1 (8 firmware entries with varied stages)
// =============================================================================

const INITIAL_FIRMWARE: FirmwareEntry[] = [
  {
    id: "fw-001",
    version: "v4.2.0",
    name: "Critical Security Patch — CVE-2026-1187",
    stage: "Uploaded",
    uploadedBy: "j.chen@hlm.com",
    date: "Mar 28, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100", "INV-5000"],
    releaseNotes: "Patches remote code execution vulnerability in OTA module.",
  },
  {
    id: "fw-002",
    version: "v4.1.0-rc1",
    name: "Security Patch Bundle",
    stage: "Testing",
    uploadedBy: "j.chen@hlm.com",
    date: "Mar 25, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100"],
    releaseNotes: "Bundle of minor security fixes for Q1 audit compliance.",
  },
  {
    id: "fw-003",
    version: "v4.0.0",
    name: "Major Release — Q1 2026",
    stage: "Approved",
    uploadedBy: "a.patel@hlm.com",
    date: "Mar 10, 2026",
    devices: 1842,
    models: ["INV-3200"],
    releaseNotes: "Full platform update with new telemetry engine.",
  },
  {
    id: "fw-004",
    version: "v3.9.2",
    name: "Hotfix — Telemetry Dropout",
    stage: "Approved",
    uploadedBy: "m.rodriguez@hlm.com",
    date: "Feb 28, 2026",
    devices: 3204,
    models: ["INV-3200", "INV-3100"],
    releaseNotes: "Fixes intermittent telemetry dropout under high load.",
  },
  {
    id: "fw-005",
    version: "v3.9.1",
    name: "Stability Improvements",
    stage: "Deprecated",
    uploadedBy: "a.patel@hlm.com",
    date: "Feb 15, 2026",
    devices: 0,
    models: ["INV-3100"],
    releaseNotes: "General stability improvements. Superseded by v3.9.2.",
  },
  {
    id: "fw-006",
    version: "v3.8.0",
    name: "Compliance Module Update",
    stage: "Deprecated",
    uploadedBy: "j.chen@hlm.com",
    date: "Jan 20, 2026",
    devices: 0,
    models: ["INV-3200", "INV-5000"],
    releaseNotes: "Updated compliance reporting for NIST 800-53 rev5.",
  },
  {
    id: "fw-007",
    version: "v4.1.1-beta",
    name: "Edge Analytics Preview",
    stage: "Uploaded",
    uploadedBy: "s.kumar@hlm.com",
    date: "Mar 27, 2026",
    devices: 0,
    models: ["INV-5000"],
    releaseNotes: "Beta preview of on-device analytics processing.",
  },
  {
    id: "fw-008",
    version: "v4.0.1",
    name: "OTA Reliability Fix",
    stage: "Testing",
    uploadedBy: "m.rodriguez@hlm.com",
    date: "Mar 22, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100", "INV-5000"],
    releaseNotes: "Improves OTA delivery success rate from 97.2% to 99.8%.",
  },
];

// =============================================================================
// Mock Audit Data — Epic 8 (30 entries for pagination testing)
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

const STAGES: readonly FirmwareStage[] = ["Uploaded", "Testing", "Approved"];
const AUDIT_PAGE_SIZE = 25;
const AVAILABLE_MODELS = ["INV-3200", "INV-3100", "INV-5000", "INV-4000", "INV-2500"];

// =============================================================================
// Helpers — Epic 8
// =============================================================================

/** Format ISO timestamp to locale-readable string (e.g., "Mar 15, 2026, 10:30 AM") */
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

/** Get default date range: last 30 days */
function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/** Sort direction type */
type SortDirection = "asc" | "desc" | null;
type AuditSortField = "user" | "action" | "resourceType" | "timestamp" | "ipAddress" | "status";

/** Badge color for audit actions */
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

// =============================================================================
// Approval Pipeline Component — Story 4.1
// =============================================================================

function ApprovalPipeline({ current }: { current: FirmwareStage }) {
  const isDeprecated = current === "Deprecated";
  const currentIdx = isDeprecated ? 3 : STAGES.indexOf(current);

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1">
          <span
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
              isDeprecated
                ? "bg-muted text-muted-foreground line-through"
                : i < currentIdx
                  ? "bg-emerald-500/10 text-emerald-600"
                  : i === currentIdx
                    ? "bg-orange-500/10 text-orange-600"
                    : "bg-muted text-muted-foreground",
            )}
          >
            {stage}
          </span>
          {i < STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        </div>
      ))}
      {isDeprecated && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
            Deprecated
          </span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Upload Modal — Story 4.2
// =============================================================================

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    version: string;
    name: string;
    models: string[];
    releaseNotes: string;
  }) => void;
}

function UploadFirmwareModal({ open, onClose, onSubmit }: UploadModalProps) {
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [errors, setErrors] = useState<{ version?: string; name?: string }>({});

  const handleSubmit = () => {
    const newErrors: { version?: string; name?: string } = {};
    if (!version.trim()) newErrors.version = "Version is required";
    if (!name.trim()) newErrors.name = "Name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      version: version.trim(),
      name: name.trim(),
      models,
      releaseNotes: releaseNotes.trim(),
    });
    setVersion("");
    setName("");
    setModels([]);
    setReleaseNotes("");
    setErrors({});
  };

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
                setErrors((prev) => ({ ...prev, version: undefined }));
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
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Security Patch Bundle"
              className={cn(
                "w-full rounded-sm border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]",
                errors.name ? "border-red-500" : "border-border",
              )}
            />
            {errors.name && <p className="mt-0.5 text-[10px] text-red-500">{errors.name}</p>}
          </div>

          {/* Compatible Models */}
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
              rows={3}
              placeholder="Describe the changes in this firmware version..."
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
            />
          </div>

          {/* File input placeholder */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Firmware File
            </label>
            <div className="flex items-center gap-2 rounded-sm border border-dashed border-border bg-muted/30 px-3 py-3">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Drag & drop or click to select (.bin, .fw, .img)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
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
            Upload
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

  const [activeTab, setActiveTab] = useState<Tab>("firmware");
  const [firmware, setFirmware] = useState<FirmwareEntry[]>(INITIAL_FIRMWARE);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Audit state — Epic 8 (Stories 8.2, 8.3, 8.4)
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
  // Story 4.2 — Upload Firmware
  // ---------------------------------------------------------------------------

  const handleUpload = useCallback(
    (data: { version: string; name: string; models: string[]; releaseNotes: string }) => {
      const newEntry: FirmwareEntry = {
        id: `fw-${Date.now()}`,
        version: data.version,
        name: data.name,
        stage: "Uploaded",
        uploadedBy: currentUser,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        devices: 0,
        models: data.models.length > 0 ? data.models : ["INV-3200"],
        releaseNotes: data.releaseNotes,
      };
      setFirmware((prev) => [newEntry, ...prev]);
      addAuditEntry("Created", "Firmware", `FW#${newEntry.id}`);
      toast.success(`Firmware ${data.version} uploaded successfully`);
      setUploadModalOpen(false);
    },
    [currentUser, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 4.3 — Multi-Stage Approval
  // ---------------------------------------------------------------------------

  const advanceStage = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;

      // Separation of duties: cannot advance own upload
      if (fw.uploadedBy === currentUser) {
        toast.error("Separation of duties: you cannot advance your own upload");
        return;
      }

      const nextStage: Record<string, FirmwareStage> = {
        Uploaded: "Testing",
        Testing: "Approved",
      };
      const next = nextStage[fw.stage];
      if (!next) return;

      const confirmed = window.confirm(`Advance ${fw.version} from "${fw.stage}" to "${next}"?`);
      if (!confirmed) return;

      setFirmware((prev) => prev.map((f) => (f.id === id ? { ...f, stage: next } : f)));
      addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
      toast.success(`${fw.version} advanced to ${next}`);
    },
    [firmware, currentUser, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 4.5 — Deprecate / Activate
  // ---------------------------------------------------------------------------

  const deprecateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      const confirmed = window.confirm(`Deprecate firmware ${fw.version}?`);
      if (!confirmed) return;

      setFirmware((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, stage: "Deprecated" as FirmwareStage, devices: 0 } : f,
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
        prev.map((f) => (f.id === id ? { ...f, stage: "Uploaded" as FirmwareStage } : f)),
      );
      addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
      toast.success(`${fw.version} reactivated`);
    },
    [firmware, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Epic 8 — Audit Log Date Range, User Filter, Sorting, Pagination, Export
  // ---------------------------------------------------------------------------

  /** Story 8.2: Filter by date range + Story 8.3: Filter by user */
  const filteredAudit = useMemo(() => {
    let entries = auditLog;

    // Date range filter (Story 8.2)
    if (auditStartDate && auditEndDate) {
      const startISO = new Date(auditStartDate + "T00:00:00Z").toISOString();
      const endISO = new Date(auditEndDate + "T23:59:59Z").toISOString();
      entries = entries.filter((e) => e.timestamp >= startISO && e.timestamp <= endISO);
    }

    // User filter (Story 8.3)
    if (auditUserFilter.trim()) {
      const q = auditUserFilter.toLowerCase();
      entries = entries.filter((e) => e.user.toLowerCase().includes(q));
    }

    return entries;
  }, [auditLog, auditStartDate, auditEndDate, auditUserFilter]);

  /** Story 8.4: Column sorting */
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

  /** Story 8.2: Date range validation and apply */
  const handleApplyDateRange = useCallback(() => {
    if (auditStartDate && auditEndDate && auditEndDate < auditStartDate) {
      setAuditDateError("End date must be after start date");
      return;
    }
    setAuditDateError("");
    setAuditPage(1);
    // Simulate loading state for UX
    setAuditLoading(true);
    setAuditError(null);
    setTimeout(() => setAuditLoading(false), 300);
  }, [auditStartDate, auditEndDate]);

  /** Story 8.3: Apply user filter */
  const handleApplyUserFilter = useCallback(() => {
    setAuditUserFilter(auditUserInput);
    setAuditPage(1);
  }, [auditUserInput]);

  /** Story 8.3: Clear user filter */
  const handleClearUserFilter = useCallback(() => {
    setAuditUserInput("");
    setAuditUserFilter("");
    setAuditPage(1);
  }, []);

  /** Story 8.4: Toggle column sort */
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

  /** Story 8.4: Retry on error */
  const handleRetryAudit = useCallback(() => {
    setAuditError(null);
    setAuditLoading(true);
    setTimeout(() => setAuditLoading(false), 300);
  }, []);

  /** Story 8.5: CSV export with proper headers and filename */
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
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Tabs + Upload Button */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("firmware")}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors duration-150",
              activeTab === "firmware"
                ? "border-b-2 border-[#FF7900] text-[#FF7900]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Firmware
          </button>
          {/* Story 8.3 AC6: Audit Log tab hidden from Technician/Viewer */}
          {canViewAudit && (
            <button
              onClick={() => setActiveTab("audit")}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors duration-150",
                activeTab === "audit"
                  ? "border-b-2 border-[#FF7900] text-[#FF7900]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Audit Log
            </button>
          )}
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
      </div>

      {/* ===== Firmware Tab — Stories 4.1, 4.3, 4.5 ===== */}
      {activeTab === "firmware" && (
        <>
          {firmware.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-gray-50 py-16">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                No firmware packages found
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Upload your first firmware package to get started.
              </p>
              {canManage && (
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
              {firmware.map((fw) => {
                const isDeprecated = fw.stage === "Deprecated";
                const isUploadedByCurrentUser = fw.uploadedBy === currentUser;
                const canAdvance =
                  canManage && !isDeprecated && fw.stage !== "Approved" && !isUploadedByCurrentUser;
                const canDeprecate = canManage && fw.stage === "Approved";
                const canActivate = isAdmin && isDeprecated;

                return (
                  <div
                    key={fw.id}
                    className={cn(
                      "rounded-sm border bg-card p-3 space-y-2.5 transition-opacity duration-150",
                      isDeprecated ? "border-border/50 opacity-60" : "border-border",
                    )}
                  >
                    {/* Header: version + badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isDeprecated ? "text-muted-foreground line-through" : "text-foreground",
                        )}
                      >
                        {fw.version}
                      </span>
                      <div className="flex items-center gap-1">
                        {fw.stage === "Approved" && (
                          <span className="flex items-center gap-0.5 rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Deployed
                          </span>
                        )}
                        {isDeprecated && (
                          <span className="flex items-center gap-0.5 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                            <Ban className="h-2.5 w-2.5" />
                            Deprecated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <p
                      className={cn(
                        "text-xs",
                        isDeprecated
                          ? "text-muted-foreground line-through"
                          : "text-muted-foreground",
                      )}
                    >
                      {fw.name}
                    </p>

                    {/* Approval Pipeline */}
                    <ApprovalPipeline current={fw.stage} />

                    {/* Metadata */}
                    <div className="space-y-1 text-[10px] text-muted-foreground">
                      <p>
                        Uploaded by: <span className="text-foreground">{fw.uploadedBy}</span>
                      </p>
                      <p>
                        Date: <span className="text-foreground">{fw.date}</span>
                      </p>
                      <p>
                        Models: <span className="text-foreground">{fw.models.join(", ")}</span>
                      </p>
                      <p>
                        Deployed to:{" "}
                        <span className="font-medium text-foreground">
                          {fw.devices.toLocaleString()} devices
                        </span>
                      </p>
                    </div>

                    {/* Action buttons — Stories 4.3 + 4.5 */}
                    {(canAdvance || canDeprecate || canActivate) && (
                      <div className="flex items-center gap-1.5 border-t border-border pt-2">
                        {canAdvance && fw.stage === "Uploaded" && (
                          <button
                            onClick={() => advanceStage(fw.id)}
                            className="flex items-center gap-1 rounded-sm bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700 transition-colors duration-150"
                          >
                            <Shield className="h-2.5 w-2.5" />
                            Advance to Testing
                          </button>
                        )}
                        {canAdvance && fw.stage === "Testing" && (
                          <button
                            onClick={() => advanceStage(fw.id)}
                            className="flex items-center gap-1 rounded-sm bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700 transition-colors duration-150"
                          >
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Approve
                          </button>
                        )}
                        {!canAdvance &&
                          canManage &&
                          !isDeprecated &&
                          fw.stage !== "Approved" &&
                          isUploadedByCurrentUser && (
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
                            <ShieldAlert className="h-2.5 w-2.5" />
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

      {/* ===== Audit Log Tab — Epic 8 (Stories 8.2, 8.3, 8.4, 8.5) ===== */}
      {activeTab === "audit" && canViewAudit && (
        <div className="space-y-3">
          {/* Filter Controls — Story 8.2 (Date Range) + Story 8.3 (User) + Story 8.5 (Export) */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Date Range — Story 8.2 */}
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

            {/* User Filter — Story 8.3 */}
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Export CSV — Story 8.5 */}
            <button
              onClick={exportAuditCsv}
              disabled={sortedAudit.length === 0}
              className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>

          {/* Date validation error — Story 8.2 AC6 */}
          {auditDateError && <p className="text-xs text-red-500">{auditDateError}</p>}

          {/* Error state — Story 8.4 AC7 */}
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

          {/* Table — Story 8.4 */}
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
                  {/* Story 8.4 AC6: Skeleton loading state */}
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
                          {/* Story 8.4 AC3: Colored action badges */}
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
                            {/* Story 8.4 AC4: Human-readable locale format */}
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

          {/* Pagination — Story 8.2 AC3 */}
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

      {/* Upload Modal — Story 4.2 */}
      <UploadFirmwareModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleUpload}
      />
    </div>
  );
}

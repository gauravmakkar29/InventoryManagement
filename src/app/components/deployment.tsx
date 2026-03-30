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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";

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

interface AuditEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  entity: string;
  ipAddress: string;
  status: "Success" | "Failed" | "Pending";
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
// Mock Audit Data — Story 4.4 (10 entries)
// =============================================================================

const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: "aud-01",
    time: "Mar 28, 2026 14:32",
    user: "j.chen@hlm.com",
    action: "Uploaded firmware v4.2.0",
    entity: "Firmware",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-02",
    time: "Mar 27, 2026 16:10",
    user: "s.kumar@hlm.com",
    action: "Uploaded firmware v4.1.1-beta",
    entity: "Firmware",
    ipAddress: "10.0.12.88",
    status: "Success",
  },
  {
    id: "aud-03",
    time: "Mar 27, 2026 09:15",
    user: "a.patel@hlm.com",
    action: "Approved firmware v4.0.0 for deployment",
    entity: "Approval",
    ipAddress: "10.0.12.12",
    status: "Success",
  },
  {
    id: "aud-04",
    time: "Mar 26, 2026 16:48",
    user: "system",
    action: "Deployment to 1,842 devices completed",
    entity: "Deployment",
    ipAddress: "—",
    status: "Success",
  },
  {
    id: "aud-05",
    time: "Mar 25, 2026 11:20",
    user: "j.chen@hlm.com",
    action: "Advanced v4.1.0-rc1 to Testing",
    entity: "Approval",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
  {
    id: "aud-06",
    time: "Mar 24, 2026 08:00",
    user: "system",
    action: "Automated vulnerability scan completed",
    entity: "Compliance",
    ipAddress: "—",
    status: "Success",
  },
  {
    id: "aud-07",
    time: "Mar 23, 2026 14:05",
    user: "m.rodriguez@hlm.com",
    action: "Deprecated firmware v3.9.1",
    entity: "Firmware",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-08",
    time: "Mar 22, 2026 10:30",
    user: "m.rodriguez@hlm.com",
    action: "Uploaded firmware v4.0.1",
    entity: "Firmware",
    ipAddress: "10.0.12.33",
    status: "Success",
  },
  {
    id: "aud-09",
    time: "Mar 21, 2026 09:00",
    user: "a.patel@hlm.com",
    action: "Failed to approve firmware v3.8.0 — missing test results",
    entity: "Approval",
    ipAddress: "10.0.12.12",
    status: "Failed",
  },
  {
    id: "aud-10",
    time: "Mar 20, 2026 15:45",
    user: "j.chen@hlm.com",
    action: "Deprecated firmware v3.8.0",
    entity: "Firmware",
    ipAddress: "10.0.12.45",
    status: "Success",
  },
];

// =============================================================================
// Constants
// =============================================================================

const STAGES: readonly FirmwareStage[] = ["Uploaded", "Testing", "Approved"];
const AUDIT_PAGE_SIZE = 6;
const AVAILABLE_MODELS = ["INV-3200", "INV-3100", "INV-5000", "INV-4000", "INV-2500"];

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

  const [activeTab, setActiveTab] = useState<Tab>("firmware");
  const [firmware, setFirmware] = useState<FirmwareEntry[]>(INITIAL_FIRMWARE);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Audit state — Story 4.4
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const currentUser = email ?? "admin@hlm.com";

  const addAuditEntry = useCallback(
    (action: string, entity: string) => {
      const now = new Date();
      const formatted =
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " " +
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      const entry: AuditEntry = {
        id: `aud-${Date.now()}`,
        time: formatted,
        user: currentUser,
        action,
        entity,
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
      addAuditEntry(`Uploaded firmware ${data.version}`, "Firmware");
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
      addAuditEntry(`Advanced ${fw.version} to ${next}`, "Approval");
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
      addAuditEntry(`Deprecated firmware ${fw.version}`, "Firmware");
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
      addAuditEntry(`Reactivated firmware ${fw.version}`, "Firmware");
      toast.success(`${fw.version} reactivated`);
    },
    [firmware, addAuditEntry],
  );

  // ---------------------------------------------------------------------------
  // Story 4.4 — Audit Log Filtering & Pagination
  // ---------------------------------------------------------------------------

  const filteredAudit = useMemo(() => {
    if (!auditSearch.trim()) return auditLog;
    const q = auditSearch.toLowerCase();
    return auditLog.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.entity.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q),
    );
  }, [auditLog, auditSearch]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAudit.length / AUDIT_PAGE_SIZE));
  const paginatedAudit = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredAudit.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredAudit, auditPage]);

  const exportAuditCsv = useCallback(() => {
    const headers = ["Time", "User", "Action", "Entity", "IP Address", "Status"];
    const rows = filteredAudit.map((e) => [
      e.time,
      e.user,
      e.action,
      e.entity,
      e.ipAddress,
      e.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredAudit.length} audit entries to CSV`);
  }, [filteredAudit]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Tabs + Upload Button */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-border">
          {(
            [
              { id: "firmware" as const, label: "Firmware" },
              { id: "audit" as const, label: "Audit Log" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors duration-150",
                activeTab === tab.id
                  ? "border-b-2 border-[#FF7900] text-[#FF7900]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
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
        {activeTab === "audit" && (
          <button
            onClick={exportAuditCsv}
            className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors duration-150"
          >
            <Download className="h-3 w-3" />
            Export CSV
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

      {/* ===== Audit Log Tab — Story 4.4 ===== */}
      {activeTab === "audit" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => {
                setAuditSearch(e.target.value);
                setAuditPage(1);
              }}
              placeholder="Search audit log..."
              className="w-full rounded-sm border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
            />
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-sm border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Entity</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    IP Address
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAudit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No audit entries found
                    </td>
                  </tr>
                ) : (
                  paginatedAudit.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors duration-150"
                    >
                      <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.time}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{log.user}</td>
                      <td className="px-3 py-2 text-foreground">{log.action}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {log.entity}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{log.ipAddress}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                            log.status === "Success"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : log.status === "Failed"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {Math.min((auditPage - 1) * AUDIT_PAGE_SIZE + 1, filteredAudit.length)}
              {" - "}
              {Math.min(auditPage * AUDIT_PAGE_SIZE, filteredAudit.length)} of{" "}
              {filteredAudit.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage <= 1}
                className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setAuditPage(page)}
                  className={cn(
                    "rounded-sm px-2 py-1 text-[10px] font-medium",
                    page === auditPage ? "bg-[#FF7900] text-white" : "hover:bg-muted",
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                disabled={auditPage >= totalAuditPages}
                className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
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

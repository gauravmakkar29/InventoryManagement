import { useState, useCallback } from "react";
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
  Filter,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";
import { generateCSV } from "../../lib/report-generator";
import { Skeleton } from "../../components/skeleton";

import type { Tab, RemediationStatus, ReportType } from "./deployment/deployment-types";
import {
  AUDIT_PAGE_SIZE,
  VULN_PAGE_SIZE,
  AVAILABLE_MODELS,
  SEVERITY_CONFIG,
  REMEDIATION_STYLES,
} from "./deployment/deployment-constants";
import { formatTimestamp, getActionBadgeClass, downloadFile } from "./deployment/deployment-utils";
import { ApprovalStageIndicator } from "./deployment/approval-stage-indicator";
import { UploadFirmwareModal } from "./deployment/upload-firmware-modal";
import { CreateVulnerabilityModal } from "./deployment/create-vulnerability-modal";
import { useAuditLog } from "../../lib/hooks/use-audit-log";
import { useFirmwareDeployment } from "../../lib/hooks/use-firmware-deployment";
import { useVulnerabilityTracker } from "../../lib/hooks/use-vulnerability-tracker";

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

  const currentUser = email ?? "admin@hlm.com";

  // --- Custom hooks (issue #160) ---
  const {
    addAuditEntry,
    sortedAudit,
    paginatedAudit,
    totalAuditPages,
    auditStartDate,
    setAuditStartDate,
    auditEndDate,
    setAuditEndDate,
    auditDateError,
    setAuditDateError,
    auditUserFilter,
    auditUserInput,
    setAuditUserInput,
    auditPage,
    setAuditPage,
    auditSortField,
    auditSortDir,
    auditLoading,
    auditError,
    handleApplyDateRange,
    handleApplyUserFilter,
    handleClearUserFilter,
    handleSort,
    handleRetryAudit,
    exportAuditCsv,
  } = useAuditLog(currentUser);

  const {
    firmware,
    filteredFirmware,
    fwStatusFilter,
    setFwStatusFilter,
    fwModelFilter,
    setFwModelFilter,
    handleUpload: hookUpload,
    advanceStage,
    deprecateFirmware,
    activateFirmware,
  } = useFirmwareDeployment(currentUser, addAuditEntry);

  const {
    vulnerabilities,
    filteredVulnerabilities,
    paginatedVulnerabilities,
    totalVulnPages,
    vulnSeverityFilter,
    setVulnSeverityFilter,
    vulnPage,
    setVulnPage,
    handleCreateVulnerability,
    handleRemediationChange,
  } = useVulnerabilityTracker(addAuditEntry);

  const [activeTab, setActiveTab] = useState<Tab>("firmware");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [vulnModalOpen, setVulnModalOpen] = useState(false);

  // Regulatory Reports — Story 11.6
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("compliance");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);

  const handleUpload = useCallback(
    (data: {
      version: string;
      name: string;
      models: string[];
      releaseNotes: string;
      fileSize: string;
      checksum: string;
    }) => {
      hookUpload(data, () => setUploadModalOpen(false));
    },
    [hookUpload],
  );

  // ---------------------------------------------------------------------------
  // Story 11.6 — Report Generation
  // ---------------------------------------------------------------------------

  const generateReport = useCallback(() => {
    let data: Record<string, unknown>[] = [];

    if (selectedReportType === "compliance") {
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
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-150",
                activeTab === tab.id
                  ? "border-b-2 border-accent-text text-accent-text"
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
            className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
          >
            <Upload className="h-3 w-3" />
            Upload Firmware
          </button>
        )}
        {activeTab === "vulnerabilities" && canManageVulns && (
          <button
            onClick={() => setVulnModalOpen(true)}
            className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
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
                      "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                      fwStatusFilter === s
                        ? "bg-accent text-white"
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
                className="appearance-none rounded-sm border border-border bg-background py-1 pl-6 pr-7 text-[12px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted py-16">
              <Package className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                {firmware.length === 0
                  ? "No firmware packages found"
                  : "No firmware found matching the selected filters"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {firmware.length === 0
                  ? "Upload your first firmware package to get started."
                  : "Try adjusting your filters."}
              </p>
              {firmware.length === 0 && canManage && (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="mt-4 flex items-center gap-1 rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
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
                      return "bg-muted text-muted-foreground";
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
                          "rounded-sm px-1.5 py-0.5 text-[12px] font-medium",
                          statusBadge,
                        )}
                      >
                        {fw.status}
                      </span>
                    </div>

                    {/* Name */}
                    <p className="text-sm text-muted-foreground">{fw.name}</p>

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
                    <div className="space-y-1 text-[12px] text-muted-foreground">
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
                            className="flex items-center gap-1 rounded-sm bg-blue-600 px-2 py-1 text-[12px] font-medium text-white hover:bg-blue-700 transition-colors duration-150"
                          >
                            <Shield className="h-2.5 w-2.5" />
                            Advance to Testing
                          </button>
                        )}
                        {canApprove && (
                          <button
                            onClick={() => advanceStage(fw.id)}
                            className="flex items-center gap-1 rounded-sm bg-emerald-600 px-2 py-1 text-[12px] font-medium text-white hover:bg-emerald-700 transition-colors duration-150"
                          >
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Approve
                          </button>
                        )}
                        {showSoDWarningUploaded && (
                          <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 text-[12px] font-medium text-amber-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Requires different tester
                          </span>
                        )}
                        {showSoDWarningTesting && (
                          <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 text-[12px] font-medium text-amber-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Requires different approver
                          </span>
                        )}
                        {canDeprecate && (
                          <button
                            onClick={() => deprecateFirmware(fw.id)}
                            className="flex items-center gap-1 rounded-sm border border-red-200 px-2 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            Deprecate
                          </button>
                        )}
                        {canActivate && (
                          <button
                            onClick={() => activateFirmware(fw.id)}
                            className="flex items-center gap-1 rounded-sm border border-emerald-200 px-2 py-1 text-[12px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors duration-150"
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
                    "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                    vulnSeverityFilter === s
                      ? "bg-accent text-white"
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
            <table className="w-full text-sm">
              <caption className="sr-only">Deployment vulnerability list</caption>
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    CVE ID
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Severity
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Affected Component
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Remediation Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
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
                        <td className="px-3 py-2.5 font-mono text-[13px] font-medium text-foreground">
                          {vuln.cveId}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[12px] font-semibold",
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
                                "rounded px-2 py-0.5 text-[12px] font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring",
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
                                "rounded px-2 py-0.5 text-[12px] font-medium",
                                REMEDIATION_STYLES[vuln.remediationStatus],
                              )}
                            >
                              {vuln.remediationStatus}
                            </span>
                          )}
                          {vuln.resolvedDate && (
                            <span className="ml-1.5 text-[12px] text-muted-foreground">
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setVulnPage((p) => Math.min(totalVulnPages, p + 1))}
                  disabled={vulnPage >= totalVulnPages}
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
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
            <label className="text-[13px] font-medium text-muted-foreground">Report Type:</label>
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
                  <span className="text-sm text-foreground">{rt.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={generateReport}
              className="flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
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
                className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
              <button
                onClick={() => exportReport("json")}
                className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <Download className="h-3 w-3" />
                Export JSON
              </button>
              <span className="text-[12px] text-muted-foreground ml-2">
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
                <table className="w-full text-sm">
                  <caption className="sr-only">Deployment report data</caption>
                  <thead className="sticky top-0">
                    <tr className="border-b-2 border-border bg-muted/50">
                      {Object.keys(reportData[0] ?? {}).map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
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
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                Select a report type and click Generate
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
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
                <label className="mb-1 block text-[13px] font-medium text-muted-foreground">
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
                    className="rounded-sm border border-border bg-background py-1.5 pl-7 pr-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-muted-foreground">
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
                    className="rounded-sm border border-border bg-background py-1.5 pl-7 pr-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyDateRange}
                className="rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
              >
                Apply
              </button>
            </div>

            {/* User Filter */}
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-muted-foreground">
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
                    className="rounded-sm border border-border bg-background py-1.5 pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyUserFilter}
                className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors duration-150"
              >
                <Search className="h-3 w-3" />
              </button>
              {auditUserFilter && (
                <button
                  onClick={handleClearUserFilter}
                  className="flex items-center gap-1 rounded-sm bg-blue-500/10 px-2 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-500/20 transition-colors duration-150"
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
              className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>

          {auditDateError && <p className="text-sm text-red-500">{auditDateError}</p>}

          {auditError && (
            <div className="flex flex-col items-center justify-center rounded-sm border border-red-200 bg-red-50 py-8">
              <AlertTriangle className="mb-2 h-6 w-6 text-red-500" />
              <p className="text-sm font-medium text-red-600">Failed to load audit logs</p>
              <p className="mt-1 text-sm text-red-500">{auditError}</p>
              <button
                onClick={handleRetryAudit}
                className="mt-3 flex items-center gap-1 rounded-sm border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors duration-150"
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
              aria-busy={auditLoading}
            >
              {auditLoading && (
                <span className="sr-only" aria-live="polite">
                  Loading audit log...
                </span>
              )}
              <table className="w-full text-sm">
                <caption className="sr-only">Deployment audit log</caption>
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
                        scope="col"
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
                              "rounded-sm px-1.5 py-0.5 text-[12px] font-medium",
                              getActionBadgeClass(log.action),
                            )}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[12px] text-muted-foreground">
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
                          <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[12px] font-medium text-emerald-600">
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-[14px] font-medium text-foreground">
                  {auditPage} / {totalAuditPages}
                </span>
                <button
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage >= totalAuditPages}
                  className="rounded-sm border border-border p-1 hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
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

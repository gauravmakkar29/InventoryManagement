import { useState, useCallback } from "react";
import { Upload, Package, Shield, Clock, Bug, FileText, Plus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogManager } from "@/lib/hooks/use-dialog-manager";

import type { Tab } from "./deployment/deployment-types";
import { UploadFirmwareModal } from "./deployment/upload-firmware-modal";
import { CreateVulnerabilityModal } from "./deployment/create-vulnerability-modal";
import { FirmwareFilters } from "./deployment/firmware-filters";
import { FirmwareList } from "./deployment/firmware-list";
import { VulnerabilityTab } from "./deployment/vulnerability-tab";
import { ReportsTab } from "./deployment/reports-tab";
import { AuditLogTab } from "./deployment/audit-log-tab";
import { DownloadLinksTab } from "./firmware/download-links-tab";
import { useAuditLog } from "@/lib/hooks/use-audit-log";
import { useFirmwareDeployment } from "@/lib/hooks/use-firmware-deployment";
import { useVulnerabilityTracker } from "@/lib/hooks/use-vulnerability-tracker";

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
  const auditLog = useAuditLog(currentUser);

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
    pendingConfirmation,
    confirmAction,
    cancelAction,
  } = useFirmwareDeployment(currentUser, auditLog.addAuditEntry);

  const vulnTracker = useVulnerabilityTracker(auditLog.addAuditEntry);

  const [activeTab, setActiveTab] = useState<Tab>("firmware");

  // Story 21.5: Unified dialog manager
  type DeploymentDialog = "upload" | "vuln";
  const dialogs = useDialogManager<DeploymentDialog>();

  // RBAC-guarded vulnerability creation
  const guardedCreateVulnerability = useCallback(
    (...args: Parameters<typeof vulnTracker.handleCreateVulnerability>) => {
      if (!canPerformAction(role, "create")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      vulnTracker.handleCreateVulnerability(...args);
    },
    [role, vulnTracker.handleCreateVulnerability],
  );

  // RBAC-guarded firmware stage advancement (AC-3 + AC-5 SoD enforced in hook)
  const guardedAdvanceStage = useCallback(
    (id: string) => {
      if (!canPerformAction(role, "approve")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      advanceStage(id);
    },
    [role, advanceStage],
  );

  // RBAC-guarded deprecation
  const guardedDeprecate = useCallback(
    (id: string) => {
      if (!canPerformAction(role, "edit")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      deprecateFirmware(id);
    },
    [role, deprecateFirmware],
  );

  // RBAC-guarded reactivation
  const guardedActivate = useCallback(
    (id: string) => {
      if (!canPerformAction(role, "edit")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      activateFirmware(id);
    },
    [role, activateFirmware],
  );

  const handleUpload = useCallback(
    (data: {
      version: string;
      name: string;
      models: string[];
      releaseNotes: string;
      fileSize: string;
      checksum: string;
    }) => {
      if (!canPerformAction(role, "create")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      try {
        hookUpload(data, () => dialogs.close());
      } catch (error: unknown) {
        // Modal stays open — form input preserved for retry.
        if (error instanceof Error && !error.message.includes("failed")) {
          toast.error("Failed to upload firmware. Please try again.");
        }
      }
    },
    [hookUpload, role],
  );

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  const TABS: { id: Tab; label: string; icon: typeof Shield; visible: boolean }[] = [
    { id: "firmware", label: "Firmware", icon: Package, visible: true },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug, visible: true },
    { id: "download-links", label: "Download Links", icon: Link2, visible: canManage },
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
            onClick={() => dialogs.open("upload")}
            className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
          >
            <Upload className="h-3 w-3" />
            Upload Firmware
          </button>
        )}
        {activeTab === "vulnerabilities" && canManageVulns && (
          <button
            onClick={() => dialogs.open("vuln")}
            className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
          >
            <Plus className="h-3 w-3" />
            Add Vulnerability
          </button>
        )}
      </div>

      {/* ===== Firmware Tab -- Stories 11.1, 11.2, 11.3, 11.7 ===== */}
      {activeTab === "firmware" && (
        <>
          <FirmwareFilters
            firmware={firmware}
            fwStatusFilter={fwStatusFilter}
            setFwStatusFilter={setFwStatusFilter}
            fwModelFilter={fwModelFilter}
            setFwModelFilter={setFwModelFilter}
          />
          <FirmwareList
            firmware={firmware}
            filteredFirmware={filteredFirmware}
            currentUser={currentUser}
            canManage={canManage}
            isAdmin={isAdmin}
            onUploadClick={() => dialogs.open("upload")}
            advanceStage={guardedAdvanceStage}
            deprecateFirmware={guardedDeprecate}
            activateFirmware={guardedActivate}
          />
        </>
      )}

      {/* ===== Vulnerabilities Tab -- Stories 11.4, 11.5 ===== */}
      {activeTab === "vulnerabilities" && (
        <VulnerabilityTab
          vulnerabilities={vulnTracker.vulnerabilities}
          filteredVulnerabilities={vulnTracker.filteredVulnerabilities}
          paginatedVulnerabilities={vulnTracker.paginatedVulnerabilities}
          totalVulnPages={vulnTracker.totalVulnPages}
          vulnSeverityFilter={vulnTracker.vulnSeverityFilter}
          setVulnSeverityFilter={vulnTracker.setVulnSeverityFilter}
          vulnPage={vulnTracker.vulnPage}
          setVulnPage={vulnTracker.setVulnPage}
          canManageVulns={canManageVulns}
          handleRemediationChange={vulnTracker.handleRemediationChange}
        />
      )}

      {/* ===== Download Links Tab -- Epic 26 (Story 26.7) ===== */}
      {activeTab === "download-links" && canManage && <DownloadLinksTab />}

      {/* ===== Regulatory Reports Tab -- Story 11.6 ===== */}
      {activeTab === "reports" && (
        <ReportsTab firmware={firmware} vulnerabilities={vulnTracker.vulnerabilities} />
      )}

      {/* ===== Audit Log Tab -- Epic 8 ===== */}
      {activeTab === "audit" && canViewAudit && (
        <AuditLogTab
          sortedAudit={auditLog.sortedAudit}
          paginatedAudit={auditLog.paginatedAudit}
          totalAuditPages={auditLog.totalAuditPages}
          auditStartDate={auditLog.auditStartDate}
          setAuditStartDate={auditLog.setAuditStartDate}
          auditEndDate={auditLog.auditEndDate}
          setAuditEndDate={auditLog.setAuditEndDate}
          auditDateError={auditLog.auditDateError}
          setAuditDateError={auditLog.setAuditDateError}
          auditUserFilter={auditLog.auditUserFilter}
          auditUserInput={auditLog.auditUserInput}
          setAuditUserInput={auditLog.setAuditUserInput}
          auditPage={auditLog.auditPage}
          setAuditPage={auditLog.setAuditPage}
          auditSortField={auditLog.auditSortField}
          auditSortDir={auditLog.auditSortDir}
          auditLoading={auditLog.auditLoading}
          auditError={auditLog.auditError}
          handleApplyDateRange={auditLog.handleApplyDateRange}
          handleApplyUserFilter={auditLog.handleApplyUserFilter}
          handleClearUserFilter={auditLog.handleClearUserFilter}
          handleSort={auditLog.handleSort}
          handleRetryAudit={auditLog.handleRetryAudit}
          exportAuditCsv={auditLog.exportAuditCsv}
        />
      )}

      {/* Upload Modal -- Story 11.1 */}
      <UploadFirmwareModal
        open={dialogs.isDialogOpen("upload")}
        onClose={() => dialogs.close()}
        onSubmit={handleUpload}
      />

      {/* Create Vulnerability Modal -- Story 11.5 */}
      {dialogs.isDialogOpen("vuln") && (
        <CreateVulnerabilityModal
          firmwareList={firmware}
          onClose={() => dialogs.close()}
          onSubmit={guardedCreateVulnerability}
        />
      )}

      {/* Story 21.2: Firmware action confirmation dialog */}
      <ConfirmDialog
        open={!!pendingConfirmation}
        title={pendingConfirmation?.title ?? ""}
        message={pendingConfirmation?.message ?? ""}
        confirmLabel={pendingConfirmation?.confirmLabel}
        confirmVariant={pendingConfirmation?.variant}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
}

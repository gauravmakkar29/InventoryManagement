import { useState } from "react";
import { ShieldCheck, Bug, Send, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { useComplianceManagement } from "@/lib/hooks/use-compliance-management";
import { useDialogManager } from "@/lib/hooks/use-dialog-manager";
import type {
  ComplianceItem,
  CertificationType,
  Vulnerability,
} from "@/lib/mock-data/compliance-data";
import type { Tab } from "./compliance-shared";
import { canSubmitForReview } from "./compliance-shared";
import { ComplianceTab } from "./compliance-tab";
import { VulnerabilitiesTab } from "./vulnerability-tab";
import { ReportsTab } from "./compliance-reports-tab";
import { SubmitForReviewModal, ReportModal, ConfirmDialog } from "./compliance-modals";
import { CreateVulnerabilityModal } from "./vulnerability-modal";

// =============================================================================
// Main Component
// =============================================================================

export function CompliancePage() {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("compliance");

  // Data hook
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    certFilter,
    setCertFilter,
    complianceItems,
    vulnerabilities,
    filteredItems,
    statusCounts,
    sortedVulnerabilities,
    handleSubmitForReview,
    handleApprove: hookApprove,
    handleDeprecate: hookDeprecate,
    handleRemediationChange,
    addComplianceItem,
    addVulnerability,
  } = useComplianceManagement();

  // Expanded vulnerability panel
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Story 21.5: Unified dialog manager — guarantees one dialog at a time
  type ComplianceDialog = "submit" | "vuln" | "report" | "confirm-approve" | "confirm-deprecate";
  const dialogs = useDialogManager<ComplianceDialog>();

  const handleApprove = (itemId: string) => {
    if (!canPerformAction(role, "approve")) {
      toast.error("Access denied — insufficient permissions");
      dialogs.close();
      return;
    }
    hookApprove(itemId);
    dialogs.close();
  };

  const handleDeprecate = (itemId: string) => {
    if (!canPerformAction(role, "edit")) {
      toast.error("Access denied — insufficient permissions");
      dialogs.close();
      return;
    }
    hookDeprecate(itemId);
    dialogs.close();
  };

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const TABS: { id: Tab; label: string; icon: typeof ShieldCheck }[] = [
    { id: "compliance", label: "Compliance Items", icon: ShieldCheck },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">Compliance & Vulnerability</h1>
        <div className="flex items-center gap-2">
          {canSubmitForReview(role) && (
            <button
              onClick={() => dialogs.open("submit")}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:border-accent-text/50 hover:text-foreground transition-colors duration-150"
            >
              <Send className="h-3.5 w-3.5" />
              Submit for Review
            </button>
          )}
          <button
            onClick={() => dialogs.open("report")}
            className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors duration-150"
          >
            <FileText className="h-3.5 w-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium cursor-pointer transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-accent-text text-accent-text"
                : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === Compliance Items Tab === */}
      {activeTab === "compliance" && (
        <ComplianceTab
          items={filteredItems}
          vulnerabilities={vulnerabilities}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          certFilter={certFilter}
          setCertFilter={setCertFilter}
          search={search}
          setSearch={setSearch}
          statusCounts={statusCounts}
          expandedItemId={expandedItemId}
          setExpandedItemId={setExpandedItemId}
          role={role}
          onSubmitForReview={handleSubmitForReview}
          onApprove={(id) => dialogs.open("confirm-approve", { itemId: id })}
          onDeprecate={(id) => dialogs.open("confirm-deprecate", { itemId: id })}
          onRemediationChange={handleRemediationChange}
        />
      )}

      {/* === Vulnerabilities Tab === */}
      {activeTab === "vulnerabilities" && (
        <VulnerabilitiesTab
          vulnerabilities={sortedVulnerabilities}
          role={role}
          onCreateVuln={() => dialogs.open("vuln")}
        />
      )}

      {/* === Reports Tab === */}
      {activeTab === "reports" && (
        <ReportsTab
          items={filteredItems}
          allItems={complianceItems}
          vulnerabilities={vulnerabilities}
        />
      )}

      {/* Modals — Story 21.5: useDialogManager ensures one-at-a-time */}
      {dialogs.isDialogOpen("submit") && (
        <SubmitForReviewModal
          onClose={dialogs.close}
          onSubmit={(data) => {
            if (!canPerformAction(role, "create")) {
              toast.error("Access denied — insufficient permissions");
              return;
            }
            try {
              const newItem: ComplianceItem = {
                id: `CMP-${String(complianceItems.length + 1).padStart(3, "0")}`,
                name: `${data.certification} — ${data.deviceModel}`,
                certType: data.certification as CertificationType,
                status: "Pending",
                lastAudit: new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                }),
                nextAudit: "TBD",
                findings: 0,
                assignedTo: "Unassigned",
                vulnerabilityIds: [],
              };
              addComplianceItem(newItem);
              dialogs.close();
              toast.success("Compliance item submitted for review");
            } catch (error: unknown) {
              // Modal stays open — form input preserved for retry.
              if (error instanceof Error && !error.message.includes("failed")) {
                toast.error("Failed to submit compliance review. Please try again.");
              }
            }
          }}
        />
      )}

      {dialogs.isDialogOpen("vuln") && (
        <CreateVulnerabilityModal
          onClose={dialogs.close}
          onSubmit={(data) => {
            if (!canPerformAction(role, "create")) {
              toast.error("Access denied — insufficient permissions");
              return;
            }
            const newVuln: Vulnerability = {
              id: `v${vulnerabilities.length + 1}`,
              cveId: data.cveId,
              title: data.title,
              severity: data.severity,
              cvssScore: data.cvssScore,
              affectedDevices: data.affectedDevices,
              patchAvailable: data.patchAvailable,
              description: data.description,
              remediationStatus: "Open",
              resolvedDate: null,
            };
            addVulnerability(newVuln);
            dialogs.close();
            toast.success("Vulnerability record created");
          }}
        />
      )}

      {dialogs.isDialogOpen("report") && (
        <ReportModal items={complianceItems} onClose={dialogs.close} />
      )}

      {(dialogs.isDialogOpen("confirm-approve") || dialogs.isDialogOpen("confirm-deprecate")) && (
        <ConfirmDialog
          title={
            dialogs.isDialogOpen("confirm-approve")
              ? "Approve Compliance Item"
              : "Deprecate Compliance Item"
          }
          message={
            dialogs.isDialogOpen("confirm-approve")
              ? "Approve this compliance item? It will be marked as compliant."
              : "Deprecate this compliance item? It will no longer be considered current."
          }
          confirmLabel={dialogs.isDialogOpen("confirm-approve") ? "Approve" : "Deprecate"}
          confirmClass={
            dialogs.isDialogOpen("confirm-approve")
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-600 hover:bg-amber-700"
          }
          onConfirm={() => {
            const itemId = dialogs.getContext<string>("itemId");
            if (!itemId) return;
            if (dialogs.isDialogOpen("confirm-approve")) {
              handleApprove(itemId);
            } else {
              handleDeprecate(itemId);
            }
          }}
          onCancel={dialogs.close}
        />
      )}
    </div>
  );
}

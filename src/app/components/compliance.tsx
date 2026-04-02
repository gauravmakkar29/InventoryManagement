import { useState, useMemo } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Archive,
  AlertTriangle,
  Bug,
  FileText,
  Download,
  Plus,
  Send,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole } from "../../lib/rbac";
import type { Role } from "../../lib/rbac";
import { VulnerabilitySearch } from "./search/vulnerability-search";
import { useComplianceManagement } from "../../lib/hooks/use-compliance-management";
import type {
  ComplianceItem,
  ComplianceStatus,
  CertificationType,
  Vulnerability,
  VulnSeverity,
  RemediationStatus,
} from "../../lib/mock-data/compliance-data";
import {
  CERT_TYPES,
  REPORT_TYPES,
  downloadFile,
  generateCSV,
  generateJSON,
} from "../../lib/mock-data/compliance-data";

// =============================================================================
// Types (moved to src/lib/mock-data/compliance-data.ts)
// =============================================================================

type Tab = "compliance" | "vulnerabilities" | "reports";

// Mock data moved to src/lib/mock-data/compliance-data.ts

// =============================================================================
// Status + Severity Styling
// =============================================================================

const STATUS_CONFIG: Record<ComplianceStatus, { bg: string; text: string; icon: typeof Shield }> = {
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: ShieldCheck },
  Pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  "In Review": { bg: "bg-blue-50", text: "text-blue-700", icon: Shield },
  Deprecated: { bg: "bg-muted", text: "text-muted-foreground", icon: Archive },
  "Non-Compliant": { bg: "bg-red-50", text: "text-red-700", icon: ShieldX },
};

const SEVERITY_CONFIG: Record<VulnSeverity, { bg: string; text: string; border: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Info: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  Open: "bg-red-50 text-red-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

// =============================================================================
// Helper: Role Checks
// =============================================================================

function canSubmitForReview(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

function canApprove(role: Role): boolean {
  return role === "Admin";
}

function canDeprecate(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

function canCreateVulnerability(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

function canUpdateRemediation(role: Role): boolean {
  return role === "Admin" || role === "Manager";
}

// Report generation helpers moved to use-compliance-management hook

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

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [vulnModalOpen, setVulnModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "deprecate";
    itemId: string;
  } | null>(null);

  const handleApprove = (itemId: string) => {
    hookApprove(itemId);
    setConfirmAction(null);
  };

  const handleDeprecate = (itemId: string) => {
    hookDeprecate(itemId);
    setConfirmAction(null);
  };

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
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
              onClick={() => setSubmitModalOpen(true)}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:border-accent-text/50 hover:text-foreground transition-colors duration-150"
            >
              <Send className="h-3.5 w-3.5" />
              Submit for Review
            </button>
          )}
          <button
            onClick={() => setReportModalOpen(true)}
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
          onApprove={(id) => setConfirmAction({ type: "approve", itemId: id })}
          onDeprecate={(id) => setConfirmAction({ type: "deprecate", itemId: id })}
          onRemediationChange={handleRemediationChange}
        />
      )}

      {/* === Vulnerabilities Tab === */}
      {activeTab === "vulnerabilities" && (
        <VulnerabilitiesTab
          vulnerabilities={sortedVulnerabilities}
          role={role}
          onCreateVuln={() => setVulnModalOpen(true)}
        />
      )}

      {/* === Reports Tab === */}
      {activeTab === "reports" && <ReportsTab items={filteredItems} allItems={complianceItems} />}

      {/* Modals */}
      {submitModalOpen && (
        <SubmitForReviewModal
          onClose={() => setSubmitModalOpen(false)}
          onSubmit={(data) => {
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
              vulnerabilities: [],
            };
            addComplianceItem(newItem);
            setSubmitModalOpen(false);
            toast.success("Compliance item submitted for review");
          }}
        />
      )}

      {vulnModalOpen && (
        <CreateVulnerabilityModal
          onClose={() => setVulnModalOpen(false)}
          onSubmit={(data) => {
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
            setVulnModalOpen(false);
            toast.success("Vulnerability record created");
          }}
        />
      )}

      {reportModalOpen && (
        <ReportModal items={complianceItems} onClose={() => setReportModalOpen(false)} />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.type === "approve"
              ? "Approve Compliance Item"
              : "Deprecate Compliance Item"
          }
          message={
            confirmAction.type === "approve"
              ? "Approve this compliance item? It will be marked as compliant."
              : "Deprecate this compliance item? It will no longer be considered current."
          }
          confirmLabel={confirmAction.type === "approve" ? "Approve" : "Deprecate"}
          confirmClass={
            confirmAction.type === "approve"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-600 hover:bg-amber-700"
          }
          onConfirm={() => {
            if (confirmAction.type === "approve") {
              handleApprove(confirmAction.itemId);
            } else {
              handleDeprecate(confirmAction.itemId);
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Compliance Tab
// =============================================================================

interface ComplianceTabProps {
  items: ComplianceItem[];
  statusFilter: ComplianceStatus | "All";
  setStatusFilter: (s: ComplianceStatus | "All") => void;
  certFilter: CertificationType | "All";
  setCertFilter: (c: CertificationType | "All") => void;
  search: string;
  setSearch: (s: string) => void;
  statusCounts: Record<string, number>;
  expandedItemId: string | null;
  setExpandedItemId: (id: string | null) => void;
  role: Role;
  onSubmitForReview: (id: string) => void;
  onApprove: (id: string) => void;
  onDeprecate: (id: string) => void;
  onRemediationChange: (vulnId: string, status: RemediationStatus) => void;
}

function ComplianceTab({
  items,
  statusFilter,
  setStatusFilter,
  certFilter,
  setCertFilter,
  search,
  setSearch,
  statusCounts,
  expandedItemId,
  setExpandedItemId,
  role,
  onSubmitForReview,
  onApprove,
  onDeprecate,
  onRemediationChange,
}: ComplianceTabProps) {
  const STATUS_FILTERS: (ComplianceStatus | "All")[] = [
    "All",
    "Approved",
    "Pending",
    "In Review",
    "Deprecated",
    "Non-Compliant",
  ];

  return (
    <div className="space-y-3">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[13px] font-medium transition-colors duration-150",
              statusFilter === s
                ? "bg-accent text-white"
                : "bg-muted text-muted-foreground hover:bg-muted",
            )}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search + cert filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search compliance items..."
            aria-label="Search compliance items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-border bg-card py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value as CertificationType | "All")}
            className="appearance-none rounded border border-border bg-card py-1.5 pl-8 pr-8 text-sm text-foreground/80 focus:border-accent-text focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="All">All Certifications</option>
            {CERT_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Compliance certifications</caption>
            <thead>
              <tr className="border-b-2 border-border bg-table-header">
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Certification
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Last Audit
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Next Audit
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-right text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Findings
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Assigned To
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-right text-[13px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No compliance items found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <ComplianceRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedItemId === item.id}
                    onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    role={role}
                    onSubmitForReview={onSubmitForReview}
                    onApprove={onApprove}
                    onDeprecate={onDeprecate}
                    onRemediationChange={onRemediationChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Compliance Row + Expandable Vulnerability Panel
// =============================================================================

interface ComplianceRowProps {
  item: ComplianceItem;
  isExpanded: boolean;
  onToggle: () => void;
  role: Role;
  onSubmitForReview: (id: string) => void;
  onApprove: (id: string) => void;
  onDeprecate: (id: string) => void;
  onRemediationChange: (vulnId: string, status: RemediationStatus) => void;
}

function ComplianceRow({
  item,
  isExpanded,
  onToggle,
  role,
  onSubmitForReview,
  onApprove,
  onDeprecate,
  onRemediationChange,
}: ComplianceRowProps) {
  const statusCfg = STATUS_CONFIG[item.status];
  const StatusIcon = statusCfg.icon;

  return (
    <>
      <tr
        className={cn(
          "border-b border-border/60 hover:bg-muted/50 cursor-pointer transition-colors duration-150",
          isExpanded && "bg-muted/80",
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90",
              )}
            />
            <div>
              <div className="text-sm font-medium text-foreground">{item.name}</div>
              <div className="text-[12px] text-muted-foreground font-mono">{item.id}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className="rounded bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
            {item.certType}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold",
              statusCfg.bg,
              statusCfg.text,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {item.status}
          </span>
        </td>
        <td className="px-3 py-2.5 text-sm text-muted-foreground">{item.lastAudit}</td>
        <td className="px-3 py-2.5 text-sm text-muted-foreground">{item.nextAudit}</td>
        <td className="px-3 py-2.5 text-right">
          <span
            className={cn(
              "text-sm tabular-nums font-medium",
              item.findings > 0 ? "text-red-600" : "text-muted-foreground",
            )}
          >
            {item.findings}
          </span>
        </td>
        <td className="px-3 py-2.5 text-sm text-muted-foreground">{item.assignedTo}</td>
        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {canSubmitForReview(role) && item.status === "Pending" && (
              <button
                onClick={() => onSubmitForReview(item.id)}
                className="rounded px-2 py-1 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Submit
              </button>
            )}
            {canApprove(role) && item.status === "In Review" && (
              <button
                onClick={() => onApprove(item.id)}
                className="rounded px-2 py-1 text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Approve
              </button>
            )}
            {canDeprecate(role) && (item.status === "Approved" || item.status === "Pending") && (
              <button
                onClick={() => onDeprecate(item.id)}
                className="rounded px-2 py-1 text-[12px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                Deprecate
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expandable vulnerability panel */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="border-t border-border bg-muted/50 px-6 py-3 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Vulnerabilities ({item.vulnerabilities.length})
                </h3>
              </div>
              {item.vulnerabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">No vulnerabilities recorded</p>
              ) : (
                <div className="space-y-2">
                  {item.vulnerabilities.map((vuln) => {
                    const sevCfg = SEVERITY_CONFIG[vuln.severity];
                    return (
                      <div
                        key={vuln.id}
                        className={cn(
                          "flex items-center justify-between rounded border p-2.5",
                          vuln.severity === "Critical"
                            ? "border-red-200 bg-red-50/50"
                            : "border-border bg-card",
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-mono text-[13px] text-foreground font-medium whitespace-nowrap">
                            {vuln.cveId}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[12px] font-semibold",
                              sevCfg.bg,
                              sevCfg.text,
                            )}
                          >
                            {vuln.severity}
                          </span>
                          <span className="text-sm text-muted-foreground truncate">
                            {vuln.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          {vuln.resolvedDate && (
                            <span className="text-[12px] text-muted-foreground">
                              Resolved: {vuln.resolvedDate}
                            </span>
                          )}
                          {canUpdateRemediation(role) ? (
                            <select
                              value={vuln.remediationStatus}
                              onChange={(e) =>
                                onRemediationChange(vuln.id, e.target.value as RemediationStatus)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "rounded px-2 py-0.5 text-[12px] font-medium border-0 focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer",
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =============================================================================
// Vulnerabilities Tab (Card Grid)
// =============================================================================

interface VulnerabilitiesTabProps {
  vulnerabilities: Vulnerability[];
  role: Role;
  onCreateVuln: () => void;
}

function VulnerabilitiesTab({ vulnerabilities, role, onCreateVuln }: VulnerabilitiesTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vulnerabilities.length} vulnerabilities sorted by CVSS score (highest first)
        </p>
        {canCreateVulnerability(role) && (
          <button
            onClick={onCreateVuln}
            className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            Report Vulnerability
          </button>
        )}
      </div>

      {/* Story 18.4 — Vulnerability Search with severity filtering */}
      <VulnerabilitySearch />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vulnerabilities.map((vuln) => {
          const sevCfg = SEVERITY_CONFIG[vuln.severity];
          return (
            <div
              key={vuln.id}
              className={cn(
                "card-elevated rounded-lg border p-4 space-y-3 transition-all duration-150 hover:shadow-md",
                vuln.severity === "Critical" && "border-red-200 ring-1 ring-red-100",
                vuln.severity === "High" && "border-orange-200",
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <span className="font-mono text-[14px] font-semibold text-foreground">
                  {vuln.cveId}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[12px] font-bold",
                    sevCfg.bg,
                    sevCfg.text,
                  )}
                >
                  {vuln.severity}
                </span>
              </div>

              {/* Title */}
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                {vuln.title}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[12px]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">CVSS</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      vuln.cvssScore >= 7.0
                        ? "text-red-600"
                        : vuln.cvssScore >= 4.0
                          ? "text-amber-600"
                          : "text-muted-foreground",
                    )}
                  >
                    {vuln.cvssScore.toFixed(1)}
                  </span>
                </div>
                <div className="h-3 w-px bg-muted" />
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {vuln.affectedDevices.toLocaleString()} devices
                  </span>
                </div>
                <div className="h-3 w-px bg-muted" />
                <span
                  className={cn(
                    "font-medium",
                    vuln.patchAvailable ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {vuln.patchAvailable ? "Patch available" : "No patch"}
                </span>
              </div>

              {/* Remediation */}
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[12px] font-medium",
                    REMEDIATION_STYLES[vuln.remediationStatus],
                  )}
                >
                  {vuln.remediationStatus}
                </span>
                {vuln.resolvedDate && (
                  <span className="text-[12px] text-muted-foreground">{vuln.resolvedDate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Reports Tab
// =============================================================================

interface ReportsTabProps {
  items: ComplianceItem[];
  allItems: ComplianceItem[];
}

function ReportsTab({ items: _items, allItems }: ReportsTabProps) {
  const stats = useMemo(() => {
    const approved = allItems.filter((i) => i.status === "Approved").length;
    const pending = allItems.filter((i) => i.status === "Pending").length;
    const inReview = allItems.filter((i) => i.status === "In Review").length;
    const deprecated = allItems.filter((i) => i.status === "Deprecated").length;
    const nonCompliant = allItems.filter((i) => i.status === "Non-Compliant").length;
    const totalVulns = allItems.reduce((acc, i) => acc + i.vulnerabilities.length, 0);
    const criticalVulns = allItems.reduce(
      (acc, i) => acc + i.vulnerabilities.filter((v) => v.severity === "Critical").length,
      0,
    );
    return {
      approved,
      pending,
      inReview,
      deprecated,
      nonCompliant,
      total: allItems.length,
      totalVulns,
      criticalVulns,
    };
  }, [allItems]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Items" value={stats.total} icon={Shield} />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={ShieldCheck}
          valueClass="text-emerald-600"
        />
        <StatCard
          label="Pending / In Review"
          value={stats.pending + stats.inReview}
          icon={Clock}
          valueClass="text-amber-600"
        />
        <StatCard
          label="Non-Compliant"
          value={stats.nonCompliant}
          icon={ShieldX}
          valueClass="text-red-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Deprecated"
          value={stats.deprecated}
          icon={Archive}
          valueClass="text-muted-foreground"
        />
        <StatCard label="Total Vulnerabilities" value={stats.totalVulns} icon={Bug} />
        <StatCard
          label="Critical Vulns"
          value={stats.criticalVulns}
          icon={AlertTriangle}
          valueClass="text-red-600"
        />
        <StatCard
          label="Compliance Rate"
          value={`${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%`}
          icon={BarChart3}
          valueClass="text-accent-text"
        />
      </div>

      {/* Report types */}
      <div className="space-y-2">
        <h3 className="text-[14px] font-semibold text-foreground/80">Available Report Types</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TYPES.map((type) => {
            const itemCount = allItems.filter(
              (i) => i.certType === type || type === "SOC 2" || type === "ISO 27001",
            ).length;
            return (
              <div
                key={type}
                className="card-elevated rounded-lg border border-border p-4 space-y-2 hover:border-accent-text/30 transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent-text" />
                  <span className="text-[14px] font-semibold text-foreground">{type}</span>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {itemCount} compliance items applicable
                </p>
                <button
                  onClick={() => {
                    const reportItems = allItems.filter((i) => i.certType === type);
                    if (reportItems.length === 0) {
                      toast.error("No data available for this report type");
                      return;
                    }
                    const json = generateJSON(reportItems);
                    const date = new Date().toISOString().split("T")[0];
                    downloadFile(
                      json,
                      `${type.toLowerCase().replace(/\s+/g, "-")}-report-${date}.json`,
                      "application/json",
                    );
                    toast.success("Report downloaded");
                  }}
                  className="flex items-center gap-1.5 rounded bg-muted px-2.5 py-1 text-[13px] font-medium text-foreground/80 hover:bg-muted transition-colors w-full justify-center"
                >
                  <Download className="h-3 w-3" />
                  Export JSON
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string | number;
  icon: typeof Shield;
  valueClass?: string;
}) {
  return (
    <div className="card-elevated rounded-lg border border-border p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", valueClass || "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

// =============================================================================
// Submit for Review Modal
// =============================================================================

interface SubmitFormData {
  firmwareVersion: string;
  deviceModel: string;
  certification: string;
}

function SubmitForReviewModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: SubmitFormData) => void;
}) {
  const [firmware, setFirmware] = useState("");
  const [model, setModel] = useState("");
  const [cert, setCert] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!firmware.trim()) newErrors.firmware = "Firmware version is required";
    if (!model.trim()) newErrors.model = "Device model is required";
    if (!cert.trim()) newErrors.certification = "Certification is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ firmwareVersion: firmware, deviceModel: model, certification: cert });
  };

  const inputClass =
    "w-full rounded border border-border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-accent-text";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-foreground">
            Submit Compliance Item for Review
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              Firmware Version <span className="text-red-500">*</span>
            </label>
            <select
              value={firmware}
              onChange={(e) => {
                setFirmware(e.target.value);
                setErrors((prev) => ({ ...prev, firmware: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select firmware version</option>
              <option value="v4.0.0">v4.0.0</option>
              <option value="v3.2.1">v3.2.1</option>
              <option value="v3.1.0">v3.1.0</option>
              <option value="v2.8.5">v2.8.5</option>
            </select>
            {errors.firmware && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.firmware}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              Device Model <span className="text-red-500">*</span>
            </label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setErrors((prev) => ({ ...prev, model: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select device model</option>
              <option value="INV-3200">INV-3200</option>
              <option value="INV-3100">INV-3100</option>
              <option value="INV-5000">INV-5000</option>
              <option value="STR-2500">STR-2500</option>
            </select>
            {errors.model && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.model}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              Certification <span className="text-red-500">*</span>
            </label>
            <select
              value={cert}
              onChange={(e) => {
                setCert(e.target.value);
                setErrors((prev) => ({ ...prev, certification: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select certification</option>
              {CERT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.certification && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.certification}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            Submit for Review
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Create Vulnerability Modal
// =============================================================================

interface VulnFormData {
  cveId: string;
  title: string;
  description: string;
  severity: VulnSeverity;
  cvssScore: number;
  affectedDevices: number;
  patchAvailable: boolean;
}

function CreateVulnerabilityModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: VulnFormData) => void;
}) {
  const [cveId, setCveId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<VulnSeverity | "">("");
  const [cvssScore, setCvssScore] = useState("");
  const [affectedDevices, setAffectedDevices] = useState("");
  const [patchAvailable, setPatchAvailable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!cveId.trim()) newErrors.cveId = "CVE ID is required";
    if (!title.trim()) newErrors.title = "Title is required";
    if (!severity) newErrors.severity = "Severity is required";
    if (
      !cvssScore.trim() ||
      isNaN(Number(cvssScore)) ||
      Number(cvssScore) < 0 ||
      Number(cvssScore) > 10
    ) {
      newErrors.cvssScore = "CVSS score must be 0-10";
    }
    if (!affectedDevices.trim() || isNaN(Number(affectedDevices)) || Number(affectedDevices) < 0) {
      newErrors.affectedDevices = "Enter a valid device count";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      cveId,
      title,
      description,
      severity: severity as VulnSeverity,
      cvssScore: Number(cvssScore),
      affectedDevices: Number(affectedDevices),
      patchAvailable,
    });
  };

  const inputClass =
    "w-full rounded border border-border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-accent-text";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-foreground">Report Vulnerability</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              CVE ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="CVE-2026-XXXX"
              value={cveId}
              onChange={(e) => {
                setCveId(e.target.value);
                setErrors((prev) => ({ ...prev, cveId: "" }));
              }}
              className={inputClass}
            />
            {errors.cveId && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.cveId}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Brief vulnerability title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={inputClass}
            />
            {errors.title && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              Description
            </label>
            <textarea
              placeholder="Detailed description of the vulnerability..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as VulnSeverity);
                  setErrors((prev) => ({ ...prev, severity: "" }));
                }}
                className={inputClass}
              >
                <option value="">Select severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Info">Info</option>
              </select>
              {errors.severity && (
                <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                  {errors.severity}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
                CVSS Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0 - 10.0"
                value={cvssScore}
                onChange={(e) => {
                  setCvssScore(e.target.value);
                  setErrors((prev) => ({ ...prev, cvssScore: "" }));
                }}
                className={inputClass}
              />
              {errors.cvssScore && (
                <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                  {errors.cvssScore}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-foreground/80">
              Affected Devices <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="Number of affected devices"
              value={affectedDevices}
              onChange={(e) => {
                setAffectedDevices(e.target.value);
                setErrors((prev) => ({ ...prev, affectedDevices: "" }));
              }}
              className={inputClass}
            />
            {errors.affectedDevices && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.affectedDevices}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="patch-available"
              checked={patchAvailable}
              onChange={(e) => setPatchAvailable(e.target.checked)}
              className="accent-[#FF7900] h-3.5 w-3.5"
            />
            <label htmlFor="patch-available" className="text-[13px] font-medium text-foreground/80">
              Patch available
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            Create Vulnerability
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Report Generation Modal
// =============================================================================

function ReportModal({ items, onClose }: { items: ComplianceItem[]; onClose: () => void }) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const totalVulns = items.reduce((acc, i) => acc + i.vulnerabilities.length, 0);

  const handleDownload = () => {
    if (items.length === 0) return;

    const date = new Date().toISOString().split("T")[0];
    if (format === "csv") {
      const csv = generateCSV(items);
      downloadFile(csv, `regulatory-report-${date}.csv`, "text/csv");
    } else {
      const json = generateJSON(items);
      downloadFile(json, `regulatory-report-${date}.json`, "application/json");
    }
    toast.success("Report downloaded");
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-foreground">Generate Regulatory Report</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available for report generation</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This report will include <span className="font-semibold">{items.length}</span>{" "}
                compliance items and <span className="font-semibold">{totalVulns}</span>{" "}
                vulnerabilities.
              </p>

              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-foreground/80">
                  Export Format
                </label>
                <div className="flex gap-3">
                  {(["csv", "json"] as const).map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={f}
                        checked={format === f}
                        onChange={() => setFormat(f)}
                        className="accent-[#FF7900]"
                      />
                      <span className="text-sm font-medium text-foreground/80 uppercase">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={items.length === 0}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors",
              items.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-accent hover:bg-accent-hover",
            )}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Confirm Dialog
// =============================================================================

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-card shadow-xl border border-border">
        <div className="p-5 space-y-3">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors",
              confirmClass,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Modal Overlay
// =============================================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 mx-4">{children}</div>
    </div>
  );
}

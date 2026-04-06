import { memo, useMemo } from "react";
import { Shield, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Role } from "../../../lib/rbac";
import type {
  ComplianceItem,
  ComplianceStatus,
  CertificationType,
  Vulnerability,
  RemediationStatus,
} from "../../../lib/mock-data/compliance-data";
import {
  STATUS_CONFIG,
  SEVERITY_CONFIG,
  REMEDIATION_STYLES,
  canSubmitForReview,
  canApprove,
  canDeprecate,
  canUpdateRemediation,
} from "./compliance-shared";
import { ComplianceFilters } from "./compliance-filters";

// =============================================================================
// Compliance Tab
// =============================================================================

export interface ComplianceTabProps {
  items: ComplianceItem[];
  vulnerabilities: Vulnerability[];
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

export function ComplianceTab({
  items,
  vulnerabilities,
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
  const vulnMap = useMemo(() => new Map(vulnerabilities.map((v) => [v.id, v])), [vulnerabilities]);

  return (
    <div className="space-y-3">
      <ComplianceFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        certFilter={certFilter}
        setCertFilter={setCertFilter}
        search={search}
        setSearch={setSearch}
        statusCounts={statusCounts}
      />

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
                    itemVulns={item.vulnerabilityIds
                      .map((id) => vulnMap.get(id))
                      .filter((v): v is Vulnerability => v != null)}
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
  itemVulns: Vulnerability[];
  isExpanded: boolean;
  onToggle: () => void;
  role: Role;
  onSubmitForReview: (id: string) => void;
  onApprove: (id: string) => void;
  onDeprecate: (id: string) => void;
  onRemediationChange: (vulnId: string, status: RemediationStatus) => void;
}

/** Memoized — rendered in .map() loop, receives stable callbacks via useCallback (#311) */
const ComplianceRow = memo(function ComplianceRow({
  item,
  itemVulns,
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
                  Vulnerabilities ({itemVulns.length})
                </h3>
              </div>
              {itemVulns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">No vulnerabilities recorded</p>
              ) : (
                <div className="space-y-2">
                  {itemVulns.map((vuln) => {
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
});

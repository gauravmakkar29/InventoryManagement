import {
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  Clock,
  X,
  AlertTriangle,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Skeleton } from "../../../components/skeleton";
import { AUDIT_PAGE_SIZE } from "./deployment-constants";
import { formatTimestamp, getActionBadgeClass } from "./deployment-utils";
import type { AuditSortField } from "./deployment-types";
import { useAuditLog } from "@/lib/hooks/use-audit-log";

interface AuditLogTabProps {
  currentUser: string;
}

export function AuditLogTab({ currentUser }: AuditLogTabProps) {
  const {
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

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Date Range */}
        <div className="flex items-end gap-2">
          <div>
            <label
              htmlFor="deploy-audit-from"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              From
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="deploy-audit-from"
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
            <label
              htmlFor="deploy-audit-to"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              To
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="deploy-audit-to"
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
            <label
              htmlFor="deploy-audit-user"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              Filter by User
            </label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="deploy-audit-user"
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
              className="flex items-center gap-1 rounded-sm bg-info/10 px-2 py-1.5 text-sm font-medium text-info-text hover:bg-info/20 transition-colors duration-150"
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

      {auditDateError && <p className="text-sm text-danger">{auditDateError}</p>}

      {auditError && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-danger-border bg-danger-bg py-8">
          <AlertTriangle className="mb-2 h-6 w-6 text-danger" />
          <p className="text-sm font-medium text-danger-text">Failed to load audit logs</p>
          <p className="mt-1 text-sm text-danger">{auditError}</p>
          <button
            onClick={handleRetryAudit}
            className="mt-3 flex items-center gap-1 rounded-sm border border-danger-border px-3 py-1.5 text-sm font-medium text-danger-text hover:bg-danger-bg transition-colors duration-150"
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
                {(
                  [
                    { field: "user" as const, label: "User" },
                    { field: "action" as const, label: "Action" },
                    { field: "resourceType" as const, label: "Resource Type" },
                    { field: "timestamp" as const, label: "Timestamp" },
                    { field: "ipAddress" as const, label: "IP Address" },
                    { field: "status" as const, label: "Status" },
                  ] satisfies { field: AuditSortField; label: string }[]
                ).map(({ field, label }) => (
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
                    <td className="px-3 py-2 font-mono text-muted-foreground">{log.ipAddress}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-sm bg-success/10 px-1.5 py-0.5 text-[12px] font-medium text-success-text">
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
  );
}

import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsAuditEntry } from "@/lib/mock-data/analytics-data";
import { ExportDropdown } from "../export-dropdown";
import type { ExportColumn } from "@/lib/use-export";

const AUDIT_EXPORT_COLUMNS: ExportColumn<AnalyticsAuditEntry>[] = [
  {
    header: "Timestamp",
    accessor: (e) => new Date(e.timestamp).toLocaleString("en-US"),
  },
  { header: "User", accessor: "user" },
  { header: "Action", accessor: "action" },
  { header: "Entity", accessor: "entity" },
  { header: "Details", accessor: "details" },
];

function actionBadgeClass(action: AnalyticsAuditEntry["action"]): string {
  switch (action) {
    case "Created":
      return "bg-blue-50 text-blue-700";
    case "Modified":
      return "bg-amber-50 text-amber-700";
    case "Deleted":
      return "bg-red-50 text-red-700";
  }
}

export function AuditLogTable({
  rangeLabel,
  searchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  filteredAuditLogs,
  paginatedLogs,
  pageSize,
  handleSearchChange,
}: {
  rangeLabel: string;
  searchQuery: string;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  filteredAuditLogs: AnalyticsAuditEntry[];
  paginatedLogs: AnalyticsAuditEntry[];
  pageSize: number;
  handleSearchChange: (query: string) => void;
}) {
  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Audit Log</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">System activity — {rangeLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Filter */}
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search audit log..."
              aria-label="Search audit log"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 w-56 rounded-lg border border-border bg-card pl-8 pr-3 text-[14px] text-foreground/80 placeholder-muted-foreground focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Export Dropdown (Story 7.6 → standardized via Story 19.20) */}
          <ExportDropdown
            data={filteredAuditLogs}
            columns={AUDIT_EXPORT_COLUMNS}
            filename="audit-log"
            title="Audit Log"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Audit log entries</caption>
          <thead>
            <tr className="border-b-2 border-border bg-table-header">
              <th
                scope="col"
                className="px-5 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                User
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Action
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Entity
              </th>
              <th
                scope="col"
                className="px-5 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[14px] text-muted-foreground">
                  No audit entries found
                </td>
              </tr>
            ) : (
              paginatedLogs.map((entry, i) => (
                <tr key={entry.id} className={cn("h-[44px]", i % 2 === 1 && "bg-muted/50")}>
                  <td className="px-5 text-[14px] font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td className="px-3 text-[14px] text-muted-foreground">{entry.user}</td>
                  <td className="px-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium",
                        actionBadgeClass(entry.action),
                      )}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-3 text-[14px] font-medium text-foreground/80">
                    {entry.entity}
                  </td>
                  <td className="px-5 text-[14px] text-muted-foreground max-w-[300px] truncate">
                    {entry.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredAuditLogs.length > pageSize && (
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
          <p className="text-[14px] text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}
            {"-"}
            {Math.min(currentPage * pageSize, filteredAuditLogs.length)} of{" "}
            {filteredAuditLogs.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-[13px] font-medium cursor-pointer",
                  currentPage === i + 1
                    ? "bg-accent text-white"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

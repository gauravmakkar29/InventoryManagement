import { Search, ChevronDown, Filter } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ComplianceStatus, CertificationType } from "../../../lib/mock-data/compliance-data";
import { CERT_TYPES } from "../../../lib/mock-data/compliance-data";

// =============================================================================
// Compliance Filters (Status pills + Search + Certification dropdown)
// =============================================================================

const STATUS_FILTERS: (ComplianceStatus | "All")[] = [
  "All",
  "Approved",
  "Pending",
  "In Review",
  "Deprecated",
  "Non-Compliant",
];

interface ComplianceFiltersProps {
  statusFilter: ComplianceStatus | "All";
  setStatusFilter: (s: ComplianceStatus | "All") => void;
  certFilter: CertificationType | "All";
  setCertFilter: (c: CertificationType | "All") => void;
  search: string;
  setSearch: (s: string) => void;
  statusCounts: Record<string, number>;
}

export function ComplianceFilters({
  statusFilter,
  setStatusFilter,
  certFilter,
  setCertFilter,
  search,
  setSearch,
  statusCounts,
}: ComplianceFiltersProps) {
  return (
    <>
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
    </>
  );
}

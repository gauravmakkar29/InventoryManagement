/**
 * IMS Gen 2 — Epic 14: Incident List Tab (Story 14.1 AC1-AC7)
 */
import { useState, useMemo } from "react";
import { AlertTriangle, Plus, Search, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/utils";
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
} from "../../../lib/incident-types";
import { SeverityBadge, StatusBadge, CategoryBadge } from "./incident-badges";

export function IncidentListTab({
  incidents,
  onSelectIncident,
  onCreateIncident,
}: {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onCreateIncident: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "All">("All");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== "All" && inc.status !== statusFilter) return false;
      if (severityFilter !== "All" && inc.severity !== severityFilter) return false;
      if (categoryFilter !== "All" && inc.category !== categoryFilter) return false;
      if (searchQuery && !inc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents..."
            aria-label="Search incidents"
            className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "All")}
          className="rounded-lg border border-border px-3 py-2 text-[14px] text-foreground/80 focus:outline-none focus:border-accent-text"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Contained">Contained</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | "All")}
          className="rounded-lg border border-border px-3 py-2 text-[14px] text-foreground/80 focus:outline-none focus:border-accent-text"
        >
          <option value="All">All Severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IncidentCategory | "All")}
          className="rounded-lg border border-border px-3 py-2 text-[14px] text-foreground/80 focus:outline-none focus:border-accent-text"
        >
          <option value="All">All Categories</option>
          <option value="Security">Security</option>
          <option value="Hardware">Hardware</option>
          <option value="Network">Network</option>
          <option value="Firmware">Firmware</option>
          <option value="Environmental">Environmental</option>
        </select>
        <button
          onClick={onCreateIncident}
          className="ml-auto rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer"
        >
          <Plus className="mr-1.5 inline h-3.5 w-3.5" /> Create Incident
        </button>
      </div>

      {/* Incident Table */}
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Security incidents</caption>
          <thead>
            <tr className="border-b-2 border-border bg-table-header">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Severity
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-center text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Devices
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Assigned To
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Created
              </th>
              <th scope="col" className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc, i) => (
              <tr
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={cn(
                  "h-[48px] cursor-pointer hover:bg-muted",
                  i % 2 === 1 && "bg-muted/50",
                )}
              >
                <td className="px-4">
                  <SeverityBadge severity={inc.severity} />
                </td>
                <td className="px-4">
                  <div>
                    <p className="text-[14px] font-medium text-foreground truncate max-w-[300px]">
                      {inc.title}
                    </p>
                    <p className="text-[13px] text-muted-foreground">{inc.id}</p>
                  </div>
                </td>
                <td className="px-4">
                  <StatusBadge status={inc.status} />
                </td>
                <td className="px-4">
                  <CategoryBadge category={inc.category} />
                </td>
                <td className="px-4 text-center text-[14px] font-medium text-foreground/80">
                  {inc.affectedDeviceCount}
                </td>
                <td className="px-4 text-[14px] text-muted-foreground">{inc.assignedToName}</td>
                <td className="px-4 text-right text-[14px] text-muted-foreground">
                  {formatRelativeTime(inc.createdAt)}
                </td>
                <td className="px-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-[15px] font-medium text-muted-foreground">
                    No incidents found
                  </p>
                  <p className="text-[14px] text-muted-foreground">
                    Adjust your filters or create a new incident
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

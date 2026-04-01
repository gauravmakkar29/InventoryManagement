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
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents..."
            aria-label="Search incidents"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-[14px] text-gray-900 placeholder:text-gray-500 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "All")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
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
          className="rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
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
          className="rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
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
          className="ml-auto rounded-lg bg-[#FF7900] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#e66d00] cursor-pointer"
        >
          <Plus className="mr-1.5 inline h-3.5 w-3.5" /> Create Incident
        </button>
      </div>

      {/* Incident Table */}
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Security incidents</caption>
          <thead>
            <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Severity
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-center text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Devices
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Assigned To
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right text-[13px] font-bold uppercase tracking-wider text-gray-600"
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
                  "h-[48px] cursor-pointer hover:bg-gray-50",
                  i % 2 === 1 && "bg-gray-50/50",
                )}
              >
                <td className="px-4">
                  <SeverityBadge severity={inc.severity} />
                </td>
                <td className="px-4">
                  <div>
                    <p className="text-[14px] font-medium text-gray-900 truncate max-w-[300px]">
                      {inc.title}
                    </p>
                    <p className="text-[13px] text-gray-500">{inc.id}</p>
                  </div>
                </td>
                <td className="px-4">
                  <StatusBadge status={inc.status} />
                </td>
                <td className="px-4">
                  <CategoryBadge category={inc.category} />
                </td>
                <td className="px-4 text-center text-[14px] font-medium text-gray-700">
                  {inc.affectedDeviceCount}
                </td>
                <td className="px-4 text-[14px] text-gray-600">{inc.assignedToName}</td>
                <td className="px-4 text-right text-[14px] text-gray-500">
                  {formatRelativeTime(inc.createdAt)}
                </td>
                <td className="px-2">
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-[15px] font-medium text-gray-600">No incidents found</p>
                  <p className="text-[14px] text-gray-500">
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

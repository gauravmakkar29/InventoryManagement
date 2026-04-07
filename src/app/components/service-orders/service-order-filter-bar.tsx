import { Search, X } from "lucide-react";
import type { ServiceOrder } from "@/lib/mock-data/service-order-data";
import { ExportDropdown } from "../export-dropdown";
import type { ExportColumn } from "@/lib/use-export";
import { STATUS_LABELS } from "@/lib/mock-data/service-order-data";

/* ─── Export Column Config ────────────────────────────────────────── */

const SERVICE_ORDER_EXPORT_COLUMNS: ExportColumn<ServiceOrder>[] = [
  { header: "ID", accessor: "id" },
  { header: "Title", accessor: "title" },
  { header: "Status", accessor: (o) => STATUS_LABELS[o.status] },
  { header: "Priority", accessor: "priority" },
  { header: "Technician", accessor: "technician" },
  { header: "Location", accessor: "location" },
  { header: "Scheduled Date", accessor: "scheduledDate" },
  { header: "Service Type", accessor: "serviceType" },
  { header: "Customer", accessor: "customer" },
];

/* ─── Filter Bar ──────────────────────────────────────────────────── */

interface FilterBarProps {
  statusFilter: string;
  priorityFilter: string;
  searchQuery: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onClearAll: () => void;
  filteredOrders: ServiceOrder[];
  filteredCount: number;
  totalCount: number;
}

export function FilterBar({
  statusFilter,
  priorityFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onClearAll,
  filteredOrders,
  filteredCount,
  totalCount,
}: FilterBarProps) {
  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || searchQuery !== "";

  const selectClasses =
    "rounded border border-border bg-card px-2 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search orders..."
          aria-label="Search orders"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded border border-border bg-card py-1.5 pl-7 pr-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 w-48"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className={selectClasses}
      >
        <option value="all">All Statuses</option>
        <option value="Scheduled">Scheduled</option>
        <option value="InProgress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      {/* Priority filter */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className={selectClasses}
      >
        <option value="all">All Priorities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 rounded border border-border px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Count */}
      <span className="text-[12px] text-muted-foreground">
        {filteredCount} of {totalCount} orders
      </span>

      {/* Standardized Export (Story 19.20) */}
      <ExportDropdown
        data={filteredOrders}
        columns={SERVICE_ORDER_EXPORT_COLUMNS}
        filename="service-orders"
        title="Service Orders"
      />
    </div>
  );
}

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Package,
  Plus,
  Download,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";
import { useDeviceInventory } from "../../lib/hooks/use-device-inventory";
import type { SortField, SortDir } from "../../lib/hooks/use-device-inventory";
import { ALL_STATUSES, ALL_LOCATIONS, ALL_MODELS } from "../../lib/mock-data/inventory-data";
import { CreateDeviceModal } from "./dialogs/create-device-modal";
import { GeoLocationMap } from "./geo-location-map";
import { AdvancedDeviceSearch } from "./search/advanced-device-search";

type Tab = "hardware" | "firmware" | "geo";

const TABS: { id: Tab; label: string }[] = [
  { id: "hardware", label: "Hardware Inventory" },
  { id: "firmware", label: "Firmware Status" },
  { id: "geo", label: "Geo Location" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string; bg: string }> = {
    [DeviceStatus.Online]: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    [DeviceStatus.Offline]: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
    [DeviceStatus.Maintenance]: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    [DeviceStatus.Decommissioned]: { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100" },
  };
  const c = config[status] ?? { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

function HealthBar({ value }: { value: number }) {
  const color =
    value >= 90
      ? "bg-emerald-500"
      : value >= 70
        ? "bg-amber-500"
        : value >= 50
          ? "bg-orange-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[14px] font-mono tabular-nums text-gray-600">{value}%</span>
    </div>
  );
}

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600 cursor-pointer select-none hover:text-gray-900 bg-[#f1f3f5]"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-[#c2410c]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[#c2410c]" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-600" />
        )}
      </div>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function Inventory() {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);
  const canCreate = canPerformAction(role, "create");
  const canEdit = canPerformAction(role, "edit");

  const [activeTab, setActiveTab] = useState<Tab>("hardware");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    devices,
    filteredDevices,
    paginatedDevices,
    search,
    setSearch,
    advancedFilters,
    setAdvancedFilters,
    sortField,
    sortDir,
    handleSort,
    handleStatusChange,
    handleCreateDevice,
    exportCsv,
    page: safeCurrentPage,
    setPage,
    totalPages,
    startIdx,
    endIdx,
  } = useDeviceInventory();

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-300">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-[14px] font-medium cursor-pointer transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-[#c2410c] text-[#c2410c]"
                : "text-gray-600 hover:text-gray-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hardware Tab */}
      {activeTab === "hardware" && (
        <>
          {/* Advanced Search + Filters (Story 18.3) */}
          <div className="space-y-3">
            <AdvancedDeviceSearch
              query={search}
              onQueryChange={setSearch}
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              statusOptions={ALL_STATUSES}
              locationOptions={ALL_LOCATIONS}
              modelOptions={ALL_MODELS}
              totalResults={filteredDevices.length}
              totalDevices={devices.length}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={exportCsv}
                disabled={filteredDevices.length === 0}
                className={cn(
                  "flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-[14px] font-medium text-gray-700 shrink-0",
                  "hover:bg-gray-50",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </button>

              {canCreate && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#FF7900] px-4 text-[14px] font-medium text-white shrink-0",
                    "hover:bg-[#e86e00]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2",
                  )}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Device
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">Device inventory list</caption>
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-[#f1f3f5]">
                    <SortHeader
                      label="Device Name"
                      field="name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Serial"
                      field="serial"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Model"
                      field="model"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Status"
                      field="status"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Location"
                      field="location"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Health"
                      field="health"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    {canEdit && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600 bg-[#f1f3f5]"
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevices.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6} className="py-16 text-center">
                        <Package className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                        <p className="text-[15px] font-medium text-gray-600">No devices found</p>
                        <p className="mt-1 text-[14px] text-gray-600">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedDevices.map((device, i) => (
                      <tr
                        key={device.id}
                        className={cn(
                          "h-[52px] border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors",
                          i % 2 === 1 && "bg-gray-50/30",
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] font-medium text-gray-900">
                            {device.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] font-mono text-gray-600">
                            {device.serial}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] text-gray-600">{device.model}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={device.status} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] text-gray-600">{device.location}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <HealthBar value={device.health} />
                        </td>
                        {canEdit && (
                          <td className="px-4 py-2.5">
                            <select
                              value={device.status}
                              onChange={(e) =>
                                handleStatusChange(device.id, e.target.value as DeviceStatus)
                              }
                              className="h-8 rounded-md border border-gray-300 bg-white px-2 text-[14px] text-gray-700 focus:border-[#c2410c] focus:outline-none focus:ring-1 focus:ring-[#c2410c]/20 cursor-pointer"
                            >
                              {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredDevices.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <span className="text-[14px] text-gray-600">
                  Showing {startIdx + 1}–{endIdx} of {filteredDevices.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 cursor-pointer",
                      "hover:bg-gray-100 hover:text-gray-700",
                      "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
                    )}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-medium cursor-pointer",
                        p === safeCurrentPage
                          ? "bg-[#FF7900] text-white"
                          : "text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 cursor-pointer",
                      "hover:bg-gray-100 hover:text-gray-700",
                      "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
                    )}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Firmware Tab — Story 3.4 */}
      {activeTab === "firmware" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-700">Firmware Status Overview</h2>
            <span className="text-[14px] text-gray-600">
              {devices.length} devices — sorted by health (unhealthiest first)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...devices]
              .sort((a, b) => a.health - b.health)
              .map((device) => (
                <div
                  key={device.id}
                  title={`Health: ${device.health}/100`}
                  className={cn(
                    "card-elevated p-4 space-y-3 transition-colors hover:bg-gray-50/50",
                    device.health < 50 && "border-l-4 border-l-red-500",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-gray-900">{device.name}</span>
                    <span className="text-[13px] font-mono text-gray-600">{device.serial}</span>
                  </div>
                  <div className="text-[14px] font-mono text-gray-600">{device.firmware}</div>
                  <HealthBar value={device.health} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Geo Tab — Epic 9 (Stories 9.1–9.5) */}
      {activeTab === "geo" && <GeoLocationMap devices={devices} />}

      {/* Create Device Modal */}
      <CreateDeviceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateDevice={handleCreateDevice}
      />
    </div>
  );
}

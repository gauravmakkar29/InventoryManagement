import { useState } from "react";
import { ChevronLeft, ChevronRight, Package, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";
import { useDeviceInventory } from "../../lib/hooks/use-device-inventory";
import { ALL_STATUSES, ALL_LOCATIONS, ALL_MODELS } from "../../lib/mock-data/inventory-data";
import type { MockDevice } from "../../lib/mock-data/inventory-data";
import { CreateDeviceModal } from "./dialogs/create-device-modal";
import { GeoLocationMap } from "./geo-location-map";
import { ExportDropdown } from "./export-dropdown";
import type { ExportColumn } from "../../lib/use-export";
import { AdvancedDeviceSearch } from "./search/advanced-device-search";
import { StatusBadge, HealthBar, SortHeader } from "./inventory/device-table-helpers";

type Tab = "hardware" | "firmware" | "geo";

const TABS: { id: Tab; label: string }[] = [
  { id: "hardware", label: "Hardware Inventory" },
  { id: "firmware", label: "Firmware Status" },
  { id: "geo", label: "Geo Location" },
];

const DEVICE_EXPORT_COLUMNS: ExportColumn<MockDevice>[] = [
  { header: "Device Name", accessor: "name" },
  { header: "Serial Number", accessor: "serial" },
  { header: "Model", accessor: "model" },
  { header: "Status", accessor: "status" },
  { header: "Location", accessor: "location" },
  { header: "Health Score", accessor: (d) => String(d.health) },
  { header: "Firmware", accessor: "firmware" },
  { header: "Last Seen", accessor: "lastSeen" },
];

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
    page: safeCurrentPage,
    setPage,
    totalPages,
    startIdx,
    endIdx,
  } = useDeviceInventory();

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-[14px] font-medium cursor-pointer transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-accent-text text-accent-text"
                : "text-muted-foreground hover:text-foreground/80",
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
              <ExportDropdown
                data={filteredDevices}
                columns={DEVICE_EXPORT_COLUMNS}
                filename="inventory-export"
                title="Hardware Inventory"
                className="h-10"
              />

              {canCreate && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-medium text-white shrink-0",
                    "hover:bg-accent-hover",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
                  <tr className="border-b-2 border-border bg-table-header">
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
                        className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground bg-table-header"
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
                        <Package
                          className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3"
                          aria-hidden="true"
                        />
                        <p className="text-[15px] font-medium text-muted-foreground">
                          No devices found
                        </p>
                        <p className="mt-1 text-[14px] text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedDevices.map((device, i) => (
                      <tr
                        key={device.id}
                        className={cn(
                          "h-[52px] border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors",
                          i % 2 === 1 && "bg-muted/30",
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] font-medium text-foreground">
                            {device.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] font-mono text-muted-foreground">
                            {device.serial}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] text-muted-foreground">{device.model}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={device.status} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[14px] text-muted-foreground">
                            {device.location}
                          </span>
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
                              className="h-8 rounded-md border border-border bg-card px-2 text-[14px] text-foreground/80 focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-ring/20 cursor-pointer"
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
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
                <span className="text-[14px] text-muted-foreground">
                  Showing {startIdx + 1}–{endIdx} of {filteredDevices.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground cursor-pointer",
                      "hover:bg-muted hover:text-foreground/80",
                      "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
                    )}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-medium cursor-pointer",
                        p === safeCurrentPage
                          ? "bg-accent text-white"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground cursor-pointer",
                      "hover:bg-muted hover:text-foreground/80",
                      "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
                    )}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
            <h2 className="text-[15px] font-semibold text-foreground/80">
              Firmware Status Overview
            </h2>
            <span className="text-[14px] text-muted-foreground">
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
                    "card-elevated p-4 space-y-3 transition-colors hover:bg-muted/50",
                    device.health < 50 && "border-l-4 border-l-red-500",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-foreground">{device.name}</span>
                    <span className="text-[13px] font-mono text-muted-foreground">
                      {device.serial}
                    </span>
                  </div>
                  <div className="text-[14px] font-mono text-muted-foreground">
                    {device.firmware}
                  </div>
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

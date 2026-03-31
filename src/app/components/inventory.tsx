import { useState, useMemo, useCallback } from "react";
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
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";
import type { DeviceSearchFilters } from "../../lib/opensearch-types";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole, canPerformAction } from "../../lib/rbac";
import { CreateDeviceModal } from "./dialogs/create-device-modal";
import type { CreateDevicePayload } from "./dialogs/create-device-modal";
import { GeoLocationMap } from "./geo-location-map";
import { AdvancedDeviceSearch } from "./search/advanced-device-search";

type Tab = "hardware" | "firmware" | "geo";
type SortField = "name" | "serial" | "model" | "status" | "location" | "health";
type SortDir = "asc" | "desc";

const TABS: { id: Tab; label: string }[] = [
  { id: "hardware", label: "Hardware Inventory" },
  { id: "firmware", label: "Firmware Status" },
  { id: "geo", label: "Geo Location" },
];

// ---------------------------------------------------------------------------
// Mock device data — replaced by API calls in production
// ---------------------------------------------------------------------------
interface MockDevice {
  id: string;
  name: string;
  serial: string;
  model: string;
  status: DeviceStatus;
  location: string;
  health: number;
  firmware: string;
  lastSeen: string;
  lat?: number;
  lng?: number;
}

const MOCK_DEVICES: MockDevice[] = [
  {
    id: "d1",
    name: "INV-3200A",
    serial: "SN-4821",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Denver, CO",
    health: 98,
    firmware: "v4.0.0",
    lastSeen: "2m ago",
    lat: 39.74,
    lng: -104.99,
  },
  {
    id: "d2",
    name: "INV-3200B",
    serial: "SN-4822",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Houston, TX",
    health: 95,
    firmware: "v4.0.0",
    lastSeen: "5m ago",
    lat: 29.76,
    lng: -95.37,
  },
  {
    id: "d3",
    name: "INV-3100C",
    serial: "SN-3901",
    model: "INV-3100",
    status: DeviceStatus.Maintenance,
    location: "Chicago, IL",
    health: 72,
    firmware: "v3.2.1",
    lastSeen: "1h ago",
    lat: 41.88,
    lng: -87.63,
  },
  {
    id: "d4",
    name: "INV-3200D",
    serial: "SN-4892",
    model: "INV-3200",
    status: DeviceStatus.Offline,
    location: "Denver, CO",
    health: 0,
    firmware: "v4.0.0",
    lastSeen: "30m ago",
    lat: 39.74,
    lng: -104.99,
  },
  {
    id: "d5",
    name: "INV-3100E",
    serial: "SN-3455",
    model: "INV-3100",
    status: DeviceStatus.Online,
    location: "New York, NY",
    health: 91,
    firmware: "v3.2.1",
    lastSeen: "1m ago",
    lat: 40.71,
    lng: -74.01,
  },
  {
    id: "d6",
    name: "INV-3200F",
    serial: "SN-5001",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Dallas, TX",
    health: 99,
    firmware: "v4.0.0",
    lastSeen: "3m ago",
    lat: 32.78,
    lng: -96.8,
  },
  {
    id: "d7",
    name: "INV-3100G",
    serial: "SN-3102",
    model: "INV-3100",
    status: DeviceStatus.Decommissioned,
    location: "Phoenix, AZ",
    health: 0,
    firmware: "v3.1.0",
    lastSeen: "7d ago",
    lat: 33.45,
    lng: -112.07,
  },
  {
    id: "d8",
    name: "INV-3200H",
    serial: "SN-5102",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Shanghai, CN",
    health: 97,
    firmware: "v4.0.0",
    lastSeen: "1m ago",
    lat: 31.23,
    lng: 121.47,
  },
  {
    id: "d9",
    name: "INV-3100J",
    serial: "SN-3210",
    model: "INV-3100",
    status: DeviceStatus.Maintenance,
    location: "Munich, DE",
    health: 65,
    firmware: "v3.2.1",
    lastSeen: "2h ago",
    lat: 48.14,
    lng: 11.58,
  },
  {
    id: "d10",
    name: "INV-3200K",
    serial: "SN-5201",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Singapore, SG",
    health: 94,
    firmware: "v4.0.0",
    lastSeen: "4m ago",
    lat: 1.35,
    lng: 103.82,
  },
  {
    id: "d11",
    name: "INV-3100L",
    serial: "SN-3301",
    model: "INV-3100",
    status: DeviceStatus.Offline,
    location: "Sao Paulo, BR",
    health: 0,
    firmware: "v3.1.0",
    lastSeen: "45m ago",
    lat: -23.55,
    lng: -46.63,
  },
  {
    id: "d12",
    name: "INV-3200M",
    serial: "SN-5301",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Denver, CO",
    health: 88,
    firmware: "v4.0.0",
    lastSeen: "8m ago",
    lat: 39.74,
    lng: -104.99,
  },
  {
    id: "d13",
    name: "INV-3200N",
    serial: "SN-5401",
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Sydney",
    health: 92,
    firmware: "v4.0.0",
    lastSeen: "6m ago",
    // No lat/lng — Story 9.5 fallback to location name lookup
  },
  {
    id: "d14",
    name: "INV-3100P",
    serial: "SN-3401",
    model: "INV-3100",
    status: DeviceStatus.Offline,
    location: "Tokyo",
    health: 0,
    firmware: "v3.2.1",
    lastSeen: "1h ago",
    lat: 0,
    lng: 0,
    // lat/lng are 0,0 — Story 9.5 AC4: treated as missing, fallback to lookup
  },
  {
    id: "d15",
    name: "INV-3100Q",
    serial: "SN-3501",
    model: "INV-3100",
    status: DeviceStatus.Maintenance,
    location: "Unknown Base",
    health: 55,
    firmware: "v3.1.0",
    lastSeen: "3h ago",
    // No coordinates, location not in lookup — Story 9.5 AC3: excluded from map
  },
];

const ALL_STATUSES = [
  DeviceStatus.Online,
  DeviceStatus.Offline,
  DeviceStatus.Maintenance,
  DeviceStatus.Decommissioned,
];
const ALL_LOCATIONS = [...new Set(MOCK_DEVICES.map((d) => d.location))].sort();
const ALL_MODELS = [...new Set(MOCK_DEVICES.map((d) => d.model))].sort();

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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
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
      <span className="text-[12px] font-mono tabular-nums text-gray-500">{value}%</span>
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
      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 cursor-pointer select-none hover:text-gray-900 bg-[#f1f3f5]"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-[#FF7900]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[#FF7900]" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-300" />
        )}
      </div>
    </th>
  );
}

// GeoLocationView replaced by GeoLocationMap component (Epic 9)

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function Inventory() {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);
  const canCreate = canPerformAction(role, "create");

  const [activeTab, setActiveTab] = useState<Tab>("hardware");
  const [search, setSearch] = useState("");
  const [statusFilter] = useState<string>("all");
  const [locationFilter] = useState<string>("all");
  const [advancedFilters, setAdvancedFilters] = useState<DeviceSearchFilters>({});
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [devices, setDevices] = useState<MockDevice[]>(MOCK_DEVICES);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const canEdit = canPerformAction(role, "edit");

  const handleStatusChange = useCallback(
    (deviceId: string, newStatus: DeviceStatus) => {
      const device = devices.find((d) => d.id === deviceId);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? { ...d, status: newStatus, health: newStatus === DeviceStatus.Offline ? 0 : d.health }
            : d,
        ),
      );
      if (device) {
        toast.success(`Device ${device.name} status updated to ${newStatus}`);
      }
    },
    [devices],
  );

  const handleCreateDevice = useCallback((payload: CreateDevicePayload) => {
    const newDevice: MockDevice = {
      id: `d${Date.now()}`,
      name: payload.name,
      serial: payload.serial,
      model: payload.model,
      status: payload.status,
      location: payload.location,
      health: payload.status === DeviceStatus.Online ? 100 : 0,
      firmware: payload.firmware,
      lastSeen: "just now",
      lat: payload.lat,
      lng: payload.lng,
    };
    setDevices((prev) => [newDevice, ...prev]);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  const filteredDevices = useMemo(() => {
    let result = [...devices];

    // Search (fuzzy matching — in production powered by OpenSearch multi_match)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.serial.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q),
      );
    }

    // Status filter (from advanced filters or legacy dropdown)
    const activeStatus =
      advancedFilters.status ?? (statusFilter !== "all" ? statusFilter : undefined);
    if (activeStatus) {
      result = result.filter((d) => d.status === activeStatus);
    }

    // Location filter (from advanced filters or legacy dropdown)
    const activeLocation =
      advancedFilters.location ?? (locationFilter !== "all" ? locationFilter : undefined);
    if (activeLocation) {
      result = result.filter((d) => d.location === activeLocation);
    }

    // Model filter (Story 18.3)
    if (advancedFilters.model) {
      result = result.filter((d) => d.model === advancedFilters.model);
    }

    // Health score range filter (Story 18.3)
    if (advancedFilters.healthScoreMin != null) {
      result = result.filter((d) => d.health >= advancedFilters.healthScoreMin!);
    }
    if (advancedFilters.healthScoreMax != null) {
      result = result.filter((d) => d.health <= advancedFilters.healthScoreMax!);
    }

    // Sort
    result.sort((a, b) => {
      const getValue = (d: MockDevice) => {
        switch (sortField) {
          case "name":
            return d.name;
          case "serial":
            return d.serial;
          case "model":
            return d.model;
          case "status":
            return d.status;
          case "location":
            return d.location;
          case "health":
            return d.health;
        }
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [devices, search, statusFilter, locationFilter, advancedFilters, sortField, sortDir]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIdx = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filteredDevices.length);
  const paginatedDevices = filteredDevices.slice(startIdx, endIdx);

  const exportCsv = useCallback(() => {
    if (filteredDevices.length === 0) return;
    const headers = [
      "Device Name",
      "Serial Number",
      "Model",
      "Status",
      "Location",
      "Health Score",
      "Firmware",
      "Last Seen",
    ];
    const rows = filteredDevices.map((d) => [
      d.name,
      d.serial,
      d.model,
      d.status,
      d.location,
      String(d.health),
      d.firmware,
      d.lastSeen,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredDevices.length} devices to CSV`);
  }, [filteredDevices]);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-[#FF7900] text-[#FF7900]"
                : "text-gray-500 hover:text-gray-700",
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
                  "flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-700 shrink-0",
                  "hover:bg-gray-50",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </button>

              {canCreate && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#FF7900] px-4 text-[13px] font-medium text-white shrink-0",
                    "hover:bg-[#e86e00]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-2",
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
                  <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
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
                        className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 bg-[#f1f3f5]"
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
                        <p className="text-[14px] font-medium text-gray-500">No devices found</p>
                        <p className="mt-1 text-[12px] text-gray-500">
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
                          <span className="text-[13px] font-medium text-gray-900">
                            {device.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] font-mono text-gray-500">
                            {device.serial}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-gray-600">{device.model}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={device.status} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-gray-600">{device.location}</span>
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
                              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[12px] text-gray-700 focus:border-[#FF7900] focus:outline-none focus:ring-1 focus:ring-[#FF7900]/20 cursor-pointer"
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
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <span className="text-[12px] text-gray-500">
                  Showing {startIdx + 1}–{endIdx} of {filteredDevices.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 cursor-pointer",
                      "hover:bg-gray-100 hover:text-gray-700",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
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
                        "flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-medium cursor-pointer",
                        p === safeCurrentPage
                          ? "bg-[#FF7900] text-white"
                          : "text-gray-500 hover:bg-gray-100",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 cursor-pointer",
                      "hover:bg-gray-100 hover:text-gray-700",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
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
            <h2 className="text-[14px] font-semibold text-gray-700">Firmware Status Overview</h2>
            <span className="text-[12px] text-gray-500">
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
                    <span className="text-[13px] font-medium text-gray-900">{device.name}</span>
                    <span className="text-[11px] font-mono text-gray-500">{device.serial}</span>
                  </div>
                  <div className="text-[12px] font-mono text-gray-600">{device.firmware}</div>
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

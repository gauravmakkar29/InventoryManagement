import { useState, useMemo, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Package } from "lucide-react";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";

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
];

const ALL_STATUSES = [
  DeviceStatus.Online,
  DeviceStatus.Offline,
  DeviceStatus.Maintenance,
  DeviceStatus.Decommissioned,
];
const ALL_LOCATIONS = [...new Set(MOCK_DEVICES.map((d) => d.location))].sort();

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
      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-gray-600"
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function Inventory() {
  const [activeTab, setActiveTab] = useState<Tab>("hardware");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
    let result = [...MOCK_DEVICES];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.serial.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Location filter
    if (locationFilter !== "all") {
      result = result.filter((d) => d.location === locationFilter);
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
  }, [search, statusFilter, locationFilter, sortField, sortDir]);

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
          {/* Search + Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by device name or serial..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20 cursor-pointer"
            >
              <option value="all">All Locations</option>
              {ALL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <span className="text-[12px] text-gray-400 shrink-0">
              {filteredDevices.length} of {MOCK_DEVICES.length} devices
            </span>
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
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
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Package className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                        <p className="text-[14px] font-medium text-gray-500">No devices found</p>
                        <p className="mt-1 text-[12px] text-gray-400">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((device, i) => (
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Firmware Tab — placeholder */}
      {activeTab === "firmware" && (
        <div className="flex h-64 items-center justify-center card-elevated">
          <div className="text-center">
            <p className="text-[14px] font-medium text-gray-500">Firmware Status</p>
            <p className="mt-1 text-[12px] text-gray-400">
              Device firmware cards will be implemented in Story 3.4
            </p>
          </div>
        </div>
      )}

      {/* Geo Tab — placeholder */}
      {activeTab === "geo" && (
        <div className="flex h-80 items-center justify-center card-elevated">
          <div className="text-center">
            <p className="text-[14px] font-medium text-gray-500">Geo Location Map</p>
            <p className="mt-1 text-[12px] text-gray-400">
              Interactive map will be implemented in Story 3.5
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

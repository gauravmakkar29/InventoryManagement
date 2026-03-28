import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";

type Tab = "hardware" | "firmware" | "geo";

const TABS: { id: Tab; label: string }[] = [
  { id: "hardware", label: "Hardware Inventory" },
  { id: "firmware", label: "Firmware Status" },
  { id: "geo", label: "Geo Location" },
];

// Placeholder data
const PLACEHOLDER_DEVICES = [
  { name: "INV-3200A", serial: "SN-4821", status: DeviceStatus.Online, location: "Denver, CO", health: 98 },
  { name: "INV-3200B", serial: "SN-4822", status: DeviceStatus.Online, location: "Houston, TX", health: 95 },
  { name: "INV-3100C", serial: "SN-3901", status: DeviceStatus.Maintenance, location: "Chicago, IL", health: 72 },
  { name: "INV-3200D", serial: "SN-4892", status: DeviceStatus.Offline, location: "Denver, CO", health: 0 },
  { name: "INV-3100E", serial: "SN-3455", status: DeviceStatus.Online, location: "New York, NY", health: 91 },
  { name: "INV-3200F", serial: "SN-5001", status: DeviceStatus.Online, location: "Dallas, TX", health: 99 },
  { name: "INV-3100G", serial: "SN-3102", status: DeviceStatus.Decommissioned, location: "Phoenix, AZ", health: 0 },
];

const PLACEHOLDER_FIRMWARE = [
  { version: "v4.0.0", model: "INV-3200", status: "Approved", devices: 1842 },
  { version: "v3.2.1", model: "INV-3100", status: "Deprecated", devices: 623 },
  { version: "v4.1.0-rc1", model: "INV-3200", status: "Testing", devices: 0 },
  { version: "v3.3.0", model: "INV-3100", status: "Uploaded", devices: 0 },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    [DeviceStatus.Online]: "bg-success/10 text-success",
    [DeviceStatus.Offline]: "bg-danger/10 text-danger",
    [DeviceStatus.Maintenance]: "bg-warning/10 text-warning",
    [DeviceStatus.Decommissioned]: "bg-muted text-muted-foreground",
    Approved: "bg-success/10 text-success",
    Deprecated: "bg-danger/10 text-danger",
    Testing: "bg-warning/10 text-warning",
    Uploaded: "bg-accent/10 text-accent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
        styles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

function HealthBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

export function Inventory() {
  const [activeTab, setActiveTab] = useState<Tab>("hardware");

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium",
              activeTab === tab.id
                ? "border-b-2 border-accent text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search devices, serials, locations..."
            className="w-full rounded-sm border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground">
          <Filter className="h-3 w-3" />
          Status
          <ChevronDown className="h-3 w-3" />
        </button>
        <button className="flex items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground">
          <Filter className="h-3 w-3" />
          Location
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      {activeTab === "hardware" && (
        <div className="overflow-auto rounded-sm border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Serial</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Health</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_DEVICES.map((d, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 font-medium text-foreground">{d.name}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{d.serial}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{d.location}</td>
                  <td className="px-3 py-2">
                    <HealthBar value={d.health} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "firmware" && (
        <div className="grid grid-cols-4 gap-2">
          {PLACEHOLDER_FIRMWARE.map((fw, i) => (
            <div
              key={i}
              className="rounded-sm border border-border bg-card p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{fw.version}</span>
                <StatusBadge status={fw.status} />
              </div>
              <p className="text-[10px] text-muted-foreground">Model: {fw.model}</p>
              <p className="text-[10px] text-muted-foreground">
                Devices: <span className="font-medium text-foreground">{fw.devices.toLocaleString()}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "geo" && (
        <div className="flex h-80 items-center justify-center rounded-sm border border-border bg-card">
          <div className="text-center text-xs text-muted-foreground">
            <p className="font-medium">Map View</p>
            <p className="mt-1">Geographic device distribution will render here</p>
            <p className="mt-0.5 text-[10px]">Powered by react-simple-maps</p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DeviceDetailPage — /inventory/:deviceId
// Story 3.7 (#429) — dedicated detail view for a single device.
// Ships an Overview tab today; Lifecycle / Ownership / Status tabs will be
// added by Stories 27.1 (#417), 27.3 (#419), 27.5 (#421) respectively.
// =============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeviceInventory } from "@/lib/hooks/use-device-inventory";
import type { MockDevice } from "@/lib/mock-data/inventory-data";
import { StatusBadge } from "./device-table-helpers";
import { LifecycleTab } from "./lifecycle-tab";

// ---------------------------------------------------------------------------
// Tab shell — minimal, in-file primitive. Kept small so future stories
// (27.1, 27.3, 27.5) can plug in without a refactor.
// ---------------------------------------------------------------------------

export interface DeviceDetailTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabStripProps {
  tabs: DeviceDetailTab[];
  activeTabId: string;
  onChange: (id: string) => void;
}

function TabStrip({ tabs, activeTabId, onChange }: TabStripProps) {
  return (
    <div
      role="tablist"
      aria-label="Device detail sections"
      className="flex gap-1 border-b border-border"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`device-detail-panel-${tab.id}`}
            id={`device-detail-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors cursor-pointer",
              active
                ? "border-accent text-accent-text"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Two-column labeled field grid
// ---------------------------------------------------------------------------

interface FieldRow {
  label: string;
  value: ReactNode;
}

function FieldGrid({ rows }: { rows: FieldRow[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col">
          <dt className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            {row.label}
          </dt>
          <dd className="mt-1 text-[14px] text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Overview tab content
// ---------------------------------------------------------------------------

function OverviewTab({ device }: { device: MockDevice }) {
  const rows: FieldRow[] = [
    { label: "Name", value: device.name },
    {
      label: "Serial Number",
      value: <span className="font-mono">{device.serial}</span>,
    },
    { label: "Model", value: device.model },
    { label: "Status", value: <StatusBadge status={device.status} /> },
    { label: "Firmware Version", value: <span className="font-mono">{device.firmware}</span> },
    { label: "Location", value: device.location || "—" },
    {
      label: "Coordinates",
      value:
        device.lat !== undefined && device.lng !== undefined ? (
          <span className="font-mono text-[13px]">
            {device.lat.toFixed(4)}, {device.lng.toFixed(4)}
          </span>
        ) : (
          "—"
        ),
    },
    { label: "Last Seen", value: device.lastSeen || "—" },
    { label: "Health Score", value: `${device.health}%` },
  ];

  return (
    <section
      role="tabpanel"
      id="device-detail-panel-overview"
      aria-labelledby="device-detail-tab-overview"
      className="pt-6"
    >
      <FieldGrid rows={rows} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DeviceDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading device detail">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="h-8 w-full animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not-found state
// ---------------------------------------------------------------------------

function DeviceNotFound({ deviceId }: { deviceId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="mb-4 h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
      <h2 className="text-[18px] font-semibold text-foreground">Device not found</h2>
      <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
        We couldn&apos;t find a device with id <code className="font-mono">{deviceId}</code>. It may
        have been decommissioned or deleted.
      </p>
      <Link
        to="/inventory"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[14px] font-medium text-foreground hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, isLoading } = useDeviceInventory();
  const [activeTabId, setActiveTabId] = useState("overview");

  const device = useMemo(
    () => (deviceId ? devices.find((d) => d.id === deviceId) : undefined),
    [devices, deviceId],
  );

  // Guard: missing :deviceId param — treat as 404 rather than throwing.
  if (!deviceId) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
        <DeviceNotFound deviceId="(missing)" />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
        <DeviceDetailSkeleton />
      </main>
    );
  }

  if (!device) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
        <DeviceNotFound deviceId={deviceId} />
      </main>
    );
  }

  const tabs: DeviceDetailTab[] = [
    { id: "overview", label: "Overview", content: <OverviewTab device={device} /> },
    // Story 27.1 (#417) — device lifecycle timeline
    // Story 27.5 (#421) — summary panel renders inside LifecycleTab
    {
      id: "lifecycle",
      label: "Lifecycle",
      content: <LifecycleTab deviceId={device.id} currentStatus={device.status} />,
    },
    // Future: { id: "ownership", label: "Ownership", content: <OwnershipTab /> } — Story 27.3
  ];

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]!;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
          <li>
            <Link to="/inventory" className="hover:text-foreground hover:underline">
              Inventory
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            {device.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">{device.name}</h1>
          <p className="mt-1 font-mono text-[13px] text-muted-foreground">{device.serial}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={device.status} />
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[14px] font-medium text-foreground hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </header>

      {/* Tab strip — prepared shell, Overview is the only tab today */}
      <TabStrip tabs={tabs} activeTabId={activeTabId} onChange={setActiveTabId} />

      {/* Active tab content */}
      {activeTab.content}
    </main>
  );
}

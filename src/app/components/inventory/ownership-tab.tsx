// =============================================================================
// OwnershipTab — Story 27.3 (#419)
//
// Renders the device's chain of custody — every customer the device has been
// assigned to, with effective dates, duration, transferring user, and the
// optional transfer reason. Horizontal on desktop, vertical on mobile.
// =============================================================================

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateCSV } from "@/lib/report-generator";
import type { DeviceOwnershipRecord } from "@/lib/types";
import { formatDurationDays } from "@/lib/mappers/device-ownership.mapper";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, type Role } from "@/lib/rbac";
import { useDeviceOwnershipChain } from "@/lib/hooks/use-device-ownership-chain";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Single record card
// ---------------------------------------------------------------------------

interface OwnershipCardProps {
  record: DeviceOwnershipRecord;
  isCurrent: boolean;
}

function OwnershipCard({ record, isCurrent }: OwnershipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasReason = !!record.transferReason && record.transferReason.trim().length > 0;

  return (
    <article
      className={cn(
        "flex min-w-[240px] flex-col gap-2 rounded-lg border bg-card px-4 py-3 text-[13px]",
        isCurrent
          ? "border-l-4 border-accent border-l-accent"
          : "border-l-4 border-border border-l-muted-foreground/40",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <strong className="text-[14px] text-foreground">{record.customerName}</strong>
        {isCurrent && (
          <span className="rounded-full bg-accent-bg px-2 py-0.5 text-[11px] font-semibold text-accent-text">
            Current
          </span>
        )}
      </header>

      {record.siteName && (
        <p className="text-[12px] text-muted-foreground">
          Site: <span className="text-foreground">{record.siteName}</span>
        </p>
      )}

      <p className="text-[12px] text-muted-foreground">
        {formatDateShort(record.startAt)} →{" "}
        {record.endAt ? formatDateShort(record.endAt) : <em>Current</em>}
      </p>

      <p className="text-[12px] text-muted-foreground">
        Duration: <span className="text-foreground">{formatDurationDays(record.durationDays)}</span>
      </p>

      <p className="text-[12px] text-muted-foreground">
        Transferred by: <span className="text-foreground">{record.transferredBy.displayName}</span>
      </p>

      {hasReason && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 self-start text-[12px] text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse transfer reason" : "Expand transfer reason"}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          )}
          {expanded ? "Hide reason" : "Show reason"}
        </button>
      )}

      {hasReason && expanded && (
        <blockquote className="mt-1 rounded-md border-l-2 border-border bg-muted/40 px-3 py-2 text-[12px] italic text-muted-foreground">
          {record.transferReason}
        </blockquote>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function triggerOwnershipCsvDownload(
  records: readonly DeviceOwnershipRecord[],
  deviceId: string,
): void {
  if (records.length === 0) {
    toast.info("No ownership records to export");
    return;
  }
  const rows = records.map((r) => ({
    customerId: r.customerId,
    customerName: r.customerName,
    siteId: r.siteId ?? "",
    siteName: r.siteName ?? "",
    startAt: r.startAt,
    endAt: r.endAt ?? "",
    durationDays: r.durationDays.toFixed(2),
    transferredBy: r.transferredBy.displayName,
    transferReason: r.transferReason ?? "",
  }));
  const csv = generateCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `device-${deviceId}-ownership-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${records.length} ownership records`);
}

// ---------------------------------------------------------------------------
// Empty / loading
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex flex-wrap gap-3" role="status" aria-label="Loading ownership chain">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 w-56 animate-pulse rounded-lg border border-border bg-muted" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
      <Users className="mb-3 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-[14px] font-medium text-foreground">No ownership changes recorded</p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        This device has been assigned to the same customer since creation.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export interface OwnershipTabProps {
  deviceId: string;
  /** Current customerId on the device (anchors the open-ended record). */
  currentCustomerId: string;
  /** Optional device creation timestamp. */
  deviceCreatedAt?: string;
}

export function OwnershipTab({ deviceId, currentCustomerId, deviceCreatedAt }: OwnershipTabProps) {
  const { groups } = useAuth();
  const role: Role = getPrimaryRole(groups);
  // CustomerAdmin is scoped to their own customer. For mock auth we assume
  // the user's own customerId matches the currently viewed device's customer
  // (real auth would resolve this from the user profile).
  const scopedCustomerId = role === "CustomerAdmin" ? currentCustomerId : undefined;

  const { records, isLoading } = useDeviceOwnershipChain(deviceId, {
    currentCustomerId,
    deviceCreatedAt,
    role,
    scopedCustomerId,
  });

  const handleExport = useCallback(() => {
    triggerOwnershipCsvDownload(records, deviceId);
  }, [records, deviceId]);

  // When chain has a single seed-only record AND no transfers, treat as
  // "no ownership changes" per AC6.
  const hasOnlyInitial = records.length === 1 && records[0]?.endAt === null;

  return (
    <section
      role="tabpanel"
      id="device-detail-panel-ownership"
      aria-labelledby="device-detail-tab-ownership"
      className="space-y-4 pt-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold text-foreground">Chain of custody</h2>
        <button
          type="button"
          onClick={handleExport}
          disabled={records.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[14px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : hasOnlyInitial ? (
        <EmptyState />
      ) : (
        <ol
          aria-label="Ownership chain"
          className="flex flex-wrap gap-3 md:flex-nowrap md:gap-2 md:overflow-x-auto"
        >
          {records.map((record, i) => (
            <li key={`${record.customerId}:${record.startAt}`} className="flex">
              <OwnershipCard record={record} isCurrent={record.endAt === null} />
              {i < records.length - 1 && (
                <span
                  aria-hidden="true"
                  className="mx-1 hidden items-center md:flex md:text-muted-foreground/40"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

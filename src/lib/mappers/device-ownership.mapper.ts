// =============================================================================
// Device Ownership Mapper — Story 27.3 (#419)
//
// Derives a chain-of-custody list from audit-log / CDC events. Pure functions;
// callers pass the events in. NO new system of record — every ownership
// change is already captured by Epic 8's audit processor when Device.customerId
// (or .siteId) is updated.
// =============================================================================

import type { CDCEvent } from "../providers/cdc-provider.types";
import type { DeviceOwnershipRecord } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function readString(
  value: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!value) return undefined;
  const v = value[key];
  return typeof v === "string" ? v : undefined;
}

function readMeta(event: CDCEvent, key: string): string | undefined {
  // CDC events may carry an additional `metadata` field on richer backends.
  // We tolerate its absence and only read it when present.
  const meta = (event as unknown as { metadata?: Record<string, unknown> }).metadata;
  if (!meta) return undefined;
  const v = meta[key];
  return typeof v === "string" ? v : undefined;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface DeriveOwnershipInput {
  /** CDC events for the device. Internally filtered to customerId/siteId
   * changes — cross-device events are not scoped here; callers should
   * pre-filter by entityId for efficiency. */
  events: readonly CDCEvent[];
  deviceCreatedAt: string;
  /** Current customerId — anchors the final open-ended record. */
  currentCustomerId: string;
  currentCustomerName: string;
  /** Optional current site for the open-ended record. */
  currentSiteId?: string;
  currentSiteName?: string;
  /** Lookup function — returns the display name for a customerId. Falls back
   * to the raw id when absent. */
  lookupCustomerName?: (customerId: string) => string | undefined;
  /** Lookup function — returns the display name for a siteId (if known). */
  lookupSiteName?: (siteId: string) => string | undefined;
  /** Escape hatch for deterministic tests. */
  nowIso?: string;
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/**
 * Build the chain of custody for a device from its audit log.
 *
 * Algorithm:
 *   1. Filter events to those that actually change `customerId` or `siteId`.
 *   2. Sort ascending by timestamp.
 *   3. Seed the chain with an open record from `deviceCreatedAt` using the
 *      first change's `oldValue` (or the current tuple when no changes).
 *   4. Walk the change list, closing the previous record at each boundary
 *      and opening a new one.
 *   5. Compute `durationDays` for every record; the final record stays open.
 *
 * Preserves the order of events as-given for identical timestamps.
 */
export function deriveOwnershipChainFromAuditLog(
  input: DeriveOwnershipInput,
): DeviceOwnershipRecord[] {
  const {
    events,
    deviceCreatedAt,
    currentCustomerId,
    currentCustomerName,
    currentSiteId,
    currentSiteName,
    lookupCustomerName,
    lookupSiteName,
    nowIso,
  } = input;
  const nowMs = nowIso ? Date.parse(nowIso) : Date.now();

  const ownershipEvents = events
    .filter((e) => {
      const before = e.oldValue as Record<string, unknown> | null;
      const after = e.newValue as Record<string, unknown> | null;
      const customerChanged = readString(after, "customerId") !== readString(before, "customerId");
      const siteChanged = readString(after, "siteId") !== readString(before, "siteId");
      return customerChanged || siteChanged;
    })
    .slice()
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  const nameOf = (id: string | undefined): string | undefined =>
    id ? (lookupCustomerName?.(id) ?? undefined) : undefined;
  const siteOf = (id: string | undefined): string | undefined =>
    id ? (lookupSiteName?.(id) ?? undefined) : undefined;

  // No ownership events → single open record anchored to the current tuple
  if (ownershipEvents.length === 0) {
    return [
      {
        customerId: currentCustomerId,
        customerName: currentCustomerName,
        ...(currentSiteId ? { siteId: currentSiteId } : {}),
        ...(currentSiteName ? { siteName: currentSiteName } : {}),
        startAt: deviceCreatedAt,
        endAt: null,
        durationDays: Math.max(0, (nowMs - Date.parse(deviceCreatedAt)) / MS_PER_DAY),
        transferredBy: { userId: "unknown", displayName: "—" },
      },
    ];
  }

  const records: DeviceOwnershipRecord[] = [];

  // Seed: from device creation up to the first change
  const first = ownershipEvents[0]!;
  const seedBefore = first.oldValue as Record<string, unknown> | null;
  const seedCustomerId = readString(seedBefore, "customerId") ?? currentCustomerId;
  const seedSiteId = readString(seedBefore, "siteId") ?? currentSiteId;
  records.push({
    customerId: seedCustomerId,
    customerName: nameOf(seedCustomerId) ?? seedCustomerId,
    ...(seedSiteId ? { siteId: seedSiteId } : {}),
    ...(seedSiteId ? { siteName: siteOf(seedSiteId) ?? seedSiteId } : {}),
    startAt: deviceCreatedAt,
    endAt: first.timestamp,
    durationDays: (Date.parse(first.timestamp) - Date.parse(deviceCreatedAt)) / MS_PER_DAY,
    transferredBy: { userId: "unknown", displayName: "—" },
  });

  for (let i = 0; i < ownershipEvents.length; i++) {
    const event = ownershipEvents[i]!;
    const next = ownershipEvents[i + 1];
    const after = event.newValue as Record<string, unknown> | null;
    const customerId = readString(after, "customerId") ?? currentCustomerId;
    const siteId = readString(after, "siteId");
    const endAt = next?.timestamp ?? null;
    const startMs = Date.parse(event.timestamp);
    const endMs = endAt ? Date.parse(endAt) : nowMs;
    const transferredBy = {
      userId: event.changedBy || "unknown",
      displayName: event.changedBy || "unknown",
    };
    const transferReason = readMeta(event, "transferReason");

    records.push({
      customerId,
      customerName: nameOf(customerId) ?? customerId,
      ...(siteId ? { siteId } : {}),
      ...(siteId ? { siteName: siteOf(siteId) ?? siteId } : {}),
      startAt: event.timestamp,
      endAt,
      durationDays: Math.max(0, (endMs - startMs) / MS_PER_DAY),
      transferredBy,
      ...(transferReason ? { transferReason } : {}),
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/** Humanizes durationDays for display. Examples: "3 years, 2 months", "15 days". */
export function formatDurationDays(days: number): string {
  if (!Number.isFinite(days) || days < 0) return "—";
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (days < 31) {
    const d = Math.round(days);
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.round((days - years * 365) / 30);
  if (remainingMonths === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"}, ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
}

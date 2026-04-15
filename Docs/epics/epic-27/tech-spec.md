# Epic 27 — Tech Spec: Device Lifecycle 360 & Cross-Domain Timeline

## Architectural Premise

**This epic adds NO new systems of record.** Every surface in Epic 27 is a **projection** over existing data: the audit log (Epic 8), CDC events (Story 20.8), firmware assignments (Story 26.9), service orders (Epic 5), and digital twin snapshots (Epic 15). The only writes this epic adds are **three optional string fields** on existing entities (Story 27.4).

Therefore, the tech spec is dominated by **read-path composition** — view-models, aggregation hooks, derivation helpers, and resilience patterns. There are no new tables, no new event streams, no new permissions.

## File Layout

### New Types (`src/lib/types.ts` — appended, no replacements)

```typescript
// Story 27.1
export type DeviceLifecycleCategory = "Firmware" | "Service" | "Ownership" | "Status" | "Audit";

export interface DeviceLifecycleEvent {
  id: string; // stable synthetic — `${sourceEntityType}:${sourceEntityId}:${timestamp}`
  deviceId: string;
  category: DeviceLifecycleCategory;
  action: string; // e.g., "firmware.deployed", "order.closed", "status.changed"
  actor: { userId: string; displayName: string } | { userId: "system"; displayName: "System" };
  timestamp: string; // ISO-8601
  summary: string; // human-readable one-liner
  sourceEntityType: "FirmwareAssignment" | "ServiceOrder" | "AuditLog" | "DigitalTwinSnapshot";
  sourceEntityId: string;
  metadata?: Record<string, unknown>;
}

// Story 27.3
export interface DeviceOwnershipRecord {
  customerId: string;
  customerName: string;
  siteId?: string;
  siteName?: string;
  startAt: string; // ISO-8601
  endAt: string | null; // null => current
  durationDays: number; // computed; for open intervals = now - startAt
  transferredBy: { userId: string; displayName: string };
  transferReason?: string;
}

// Story 27.5
export type DeviceStatusSource = "user" | "system" | "device" | "unknown";

export interface DeviceStatusTransition {
  status: DeviceStatus; // existing enum
  startAt: string;
  endAt: string | null;
  durationMs: number;
  actor: string; // userId | "system" | "device" | "unknown"
  source: DeviceStatusSource;
  reason?: string;
}

// Story 27.4 — field additions to existing types
// Firmware / FirmwareVersion gains: approvalComment?: string; rejectionReason?: string;
// FirmwareAssignment gains:         rollbackReason?: string;
```

### New Hooks

```
src/lib/hooks/
├── use-device-lifecycle.ts          ← Story 27.1
├── use-device-ownership-chain.ts    ← Story 27.3
└── use-device-status-history.ts     ← Story 27.5
```

### New Mappers / Pure Helpers

```
src/lib/mappers/
├── device-lifecycle.mapper.ts       ← Story 27.1 — event projections from each source
├── device-ownership.mapper.ts       ← Story 27.3 — deriveOwnershipChainFromAuditLog()
└── device-status.mapper.ts          ← Story 27.5 — derivation + computeAvailability + detectFlapping

src/lib/firmware/
└── firmware-version-utils.ts        ← Story 27.4 — isRollback() semver helper

src/lib/rbac-lifecycle.ts            ← Story 27.2 — getDefaultLifecycleCategories() + getPermittedLifecycleCategories()
```

### New Components

```
src/app/components/devices/
├── device-lifecycle-tab.tsx            ← Story 27.1 — container, filters, export
├── device-lifecycle-timeline.tsx       ← Story 27.1 — vertical timeline renderer
├── device-lifecycle-filters.tsx        ← Story 27.1 + 27.2 — date-range + category + persona defaults
├── device-ownership-tab.tsx            ← Story 27.3
├── device-ownership-card.tsx           ← Story 27.3
└── device-status-summary.tsx           ← Story 27.5 — panel at top of Lifecycle tab
```

### Modified Components (existing — additive changes only)

```
src/app/components/devices/device-detail-page.tsx
  + Add "Lifecycle" and "Ownership" tabs to existing tab list (Story 27.1, 27.3)

src/app/components/firmware/firmware-approval-actions.tsx (or equivalent)
  + Approval comment textarea (optional) — Story 27.4
  + Rejection reason textarea (required, min 10) — Story 27.4

src/app/components/firmware/firmware-assignment-modal.tsx (or equivalent)
  + Rollback detection + required rollback reason textarea — Story 27.4

src/app/components/firmware/firmware-version-timeline.tsx (from Story 20.6)
  + Render approvalComment / rejectionReason inline with approval/rejection nodes — Story 27.4

src/app/components/devices/device-reassignment-form.tsx (or equivalent)
  + Optional transfer reason textarea; passed to mutation as metadata.transferReason — Story 27.3
```

## Aggregation Algorithm — `useDeviceLifecycle` (Story 27.1)

### Parallel fetch via TanStack `useQueries`

```typescript
const results = useQueries({
  queries: [
    {
      queryKey: ["lifecycle", deviceId, "audit", timeRange],
      queryFn: () => apiProvider.getChangeHistory(deviceId, timeRange),
    },
    {
      queryKey: ["lifecycle", deviceId, "firmware", timeRange],
      queryFn: () => apiProvider.listFirmwareAssignments(deviceId, timeRange),
    },
    {
      queryKey: ["lifecycle", deviceId, "service", timeRange],
      queryFn: () => apiProvider.listServiceOrdersByDevice(deviceId, timeRange),
    },
  ],
});
```

### Merge + sort

Each source's raw records are projected to `DeviceLifecycleEvent[]` via a source-specific mapper in `device-lifecycle.mapper.ts`:

- `projectAuditToLifecycle(entries): DeviceLifecycleEvent[]` — excludes entries already represented by a more specific source (e.g., firmware assignment changes handled by the firmware mapper, not duplicated as Audit)
- `projectFirmwareAssignmentToLifecycle(assignments): DeviceLifecycleEvent[]` — produces Firmware-category events, including `action: "firmware.rolled_back"` when `rollbackReason` is set
- `projectServiceOrdersToLifecycle(orders): DeviceLifecycleEvent[]` — produces Service-category events per status transition on the order

Merged array is sorted by `timestamp` DESC; ties broken by category priority: `Firmware > Service > Ownership > Status > Audit`.

### Resilience — partial failure

If `results[i].isError === true` for any i, the hook returns:

```typescript
{
  events: DeviceLifecycleEvent[],   // from successful sources
  unavailableSources: ("Audit" | "Firmware" | "Service")[],
  isLoading: boolean,
}
```

The Lifecycle tab renders a warning banner listing `unavailableSources`, and continues to render whatever events ARE available. **A single source failure MUST NOT blank the timeline.**

## Ownership Chain Derivation (Story 27.3)

### Input

- `AuditLogEntry[]` filtered to entries where `resourceType === "Device"`, `resourceId === deviceId`, and the change payload touched `customerId` or `siteId`
- Device's `createdAt` and current `customerId` (anchor for the first record)

### Algorithm (in `device-ownership.mapper.ts`)

```typescript
export function deriveOwnershipChainFromAuditLog(
  entries: AuditLogEntry[],
  device: Pick<Device, "createdAt" | "customerId" | "siteId">,
): DeviceOwnershipRecord[] {
  // 1. Sort entries ascending by timestamp
  // 2. Seed the chain with an open-ended record from device.createdAt → (first change OR now)
  //    using the customerId as of device.createdAt (read from entry.oldValue of first change, or current if none)
  // 3. Iterate entries: for each customerId/siteId change, close the previous open record
  //    (endAt = entry.timestamp), and open a new one
  // 4. Final record has endAt = null (current)
  // 5. Compute durationDays for each record (for open => now - startAt)
  // 6. Enrich with customerName / siteName via a fetch keyed by customer IDs encountered
}
```

### CustomerAdmin scoping

After derivation, if the current user is a CustomerAdmin scoped to `customerId = X`, filter out records where `record.customerId !== X`. Enforced in the hook, not in UI — so mock dev data with multiple customers still tests this correctly.

## Status History + Availability (Story 27.5)

### Derivation

Same pattern as ownership chain — filter audit entries to `resourceType === "Device"` + `changes.status`, group into half-open intervals.

### Availability calculation

```typescript
export function computeAvailability(
  transitions: DeviceStatusTransition[],
  window: { start: string; end: string },
): number {
  const totalMs = Date.parse(window.end) - Date.parse(window.start);
  if (totalMs <= 0) return 0;

  const onlineMs = transitions
    .filter((t) => t.status === "online")
    .reduce((sum, t) => {
      // clip each transition to window bounds
      const startMs = Math.max(Date.parse(t.startAt), Date.parse(window.start));
      const endMs = Math.min(t.endAt ? Date.parse(t.endAt) : Date.now(), Date.parse(window.end));
      return sum + Math.max(0, endMs - startMs);
    }, 0);

  return (onlineMs / totalMs) * 100;
}
```

Decommissioned devices return `NaN` (signaled as "N/A" in UI) — the caller checks `device.status === "decommissioned"` before calling.

### Flapping detection

```typescript
export function detectFlapping(
  transitions: DeviceStatusTransition[],
  windowMs = 24 * 60 * 60 * 1000,
  threshold = 5,
): { count: number; isFlapping: boolean } {
  const nowMs = Date.now();
  const count = transitions.filter((t) => nowMs - Date.parse(t.startAt) <= windowMs).length;
  return { count, isFlapping: count > threshold };
}
```

## Persona → Category Mapping (Story 27.2)

Defined in `src/lib/rbac-lifecycle.ts`:

```typescript
export const DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE: Record<UserRole, DeviceLifecycleCategory[]> = {
  Admin:         ["Firmware", "Service", "Ownership", "Status", "Audit"],
  Manager:       ["Firmware", "Service", "Ownership", "Status"],
  Technician:    ["Firmware", "Service", "Status"],
  Viewer:        ["Firmware", "Service", "Status"],
  CustomerAdmin: ["Firmware", "Service", "Ownership"],
};

export const PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE: Record<UserRole, DeviceLifecycleCategory[]> = {
  Admin:         ["Firmware", "Service", "Ownership", "Status", "Audit"],
  Manager:       ["Firmware", "Service", "Ownership", "Status", "Audit"],
  Technician:    ["Firmware", "Service", "Status"],
  Viewer:        ["Firmware", "Service", "Status"],
  CustomerAdmin: ["Firmware", "Service", "Ownership"],  // Audit hidden — tenant isolation
};

export function getDefaultLifecycleCategories(role: UserRole): DeviceLifecycleCategory[] { ... }
export function getPermittedLifecycleCategories(role: UserRole): DeviceLifecycleCategory[] { ... }
```

### localStorage contract

- **Key:** `lifecycle.filter.${role}.${deviceId}`
- **Value:** JSON-encoded `DeviceLifecycleCategory[]` — only categories the role is permitted to see
- **Write debounce:** 150 ms after the last toggle
- **Reset:** delete the key; UI reapplies `getDefaultLifecycleCategories(role)`

## Rollback Detection (Story 27.4)

```typescript
// src/lib/firmware/firmware-version-utils.ts
import semver from "semver";

export function isRollback(newVersion: string, previousVersion: string | null): boolean {
  if (!previousVersion) return false;
  // semver.coerce to tolerate non-strict versions present in mock/legacy data
  const a = semver.coerce(newVersion);
  const b = semver.coerce(previousVersion);
  if (!a || !b) return false;
  return semver.lt(a, b);
}
```

**Edge cases covered in unit tests:**

- `previousVersion === null` → false (first assignment cannot be a rollback)
- Equal versions → false (re-assignment, not rollback)
- Prerelease tags (e.g., `1.2.0-beta.1` → `1.1.0`) → true
- Invalid strings (e.g., "unknown") → false (defensive)

## Error Handling Strategy

Errors from source queries in `useDeviceLifecycle` follow this classification — consistent with the existing `ApiError` pattern:

| Error class             | Treatment in Lifecycle UI                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NetworkError`          | Source excluded; banner "Audit log unavailable — network error". User can retry via a button in the banner. |
| `AuthError`             | Source excluded; banner "Access denied for this data source". No retry.                                     |
| `NotFoundError`         | Source excluded (treated as empty); no banner.                                                              |
| `TimeoutError`          | Source excluded; banner includes "try again in a moment".                                                   |
| Validation / unexpected | Source excluded; banner "Unexpected error — details logged". Error reported to logger per NIST AU-2.        |

## NIST Compliance Notes

- **AU-2 / AU-3:** Every timeline read is a read-only operation — no new audit writes required. However, CSV exports MUST emit an audit log entry of category `DATA_EXPORT` with `resourceType="Device"`, `resourceId=deviceId`, and metadata containing the time range and event count. Reuses the pattern from `audit-log-tab.tsx` CSV export.
- **AC-3:** Ownership tab visibility routes through `canAccess("device.ownership", role)` — this permission must be added to `rbac.ts` if not already present. Viewer and Technician MUST return false.
- **AC-5 (SoD):** The person writing an approval/rejection/rollback reason (Story 27.4) is the same person executing the action; no delegation in this story.
- **SR-11 / CM-8:** Ownership chain CSV export is the compliance artifact for chain-of-custody evidence.

## Testing Strategy

### Unit tests (≥ 85% per story)

- `device-lifecycle.mapper.test.ts` — projection correctness per source, ordering, tie-breaking
- `use-device-lifecycle.test.ts` — merge behavior, partial-failure, empty-state, large-result pagination
- `device-ownership.mapper.test.ts` — empty, single, multi-transfer, missing siteId, CustomerAdmin scoping
- `device-status.mapper.test.ts` — availability math (including clipping at window bounds), flapping thresholds
- `firmware-version-utils.test.ts` — isRollback edge cases
- `rbac-lifecycle.test.ts` — default + permitted category mapping for all 5 roles

### Integration tests

- TanStack query cache invalidation on device or firmware mutation
- localStorage persist/restore across page reloads
- Error boundary resilience (simulate 500 from a single source)

### E2E tests (Playwright Java)

- `LifecycleTabSmokeTest` — tab visibility, events render, filter toggling, CSV export
- `OwnershipChainE2ETest` — transfer with reason, chain display, CSV export, RBAC scoping
- `FirmwareReasonCaptureE2ETest` — approve/reject/rollback flows with reason capture, display in firmware + device timelines
- `StatusHistoryE2ETest` — Status Summary panel, flapping detection, decommissioned handling

### Storybook coverage

- `DeviceLifecycleTimeline` — empty, loading, mixed events, partial-failure, single category
- `DeviceOwnershipCard` — active, historical, with/without reason, CustomerAdmin-scoped
- `DeviceStatusSummary` — stable, flapping, decommissioned

## What This Tech Spec Does NOT Cover

Consistent with the epic's composition-only philosophy:

- **No new DynamoDB table design** — all data sources already exist
- **No new Lambda functions** — existing audit processor and mock adapters are sufficient
- **No new AppSync resolvers** — reads use existing `getChangeHistory` / `listFirmwareAssignments` / `listServiceOrders`
- **No new RBAC actions** beyond the single `device.ownership` view permission
- **No new infra module in `infra/reference/aws-terraform/`** — zero infra changes

## Delivery Order

1. **Sprint 1 — Foundation**
   - 27.1 (Per-Device Unified Lifecycle Timeline) — blocks 27.2, 27.5
   - 27.2 (Persona-Aware Filtering) — straightforward overlay on 27.1
2. **Sprint 2 — Derived Views + Field Additions**
   - 27.3 (Ownership Chain)
   - 27.4 (Approval Comments + Rollback Reasons)
   - 27.5 (Status History) — depends on 27.1 for the Lifecycle tab host

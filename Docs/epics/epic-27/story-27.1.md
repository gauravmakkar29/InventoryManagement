# Story 27.1: Per-Device Unified Lifecycle Timeline

**Epic:** Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline
**Phase:** PHASE 1: COMPOSITION
**Persona:** Raj (Operations Manager) / Field Technician
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** #417
**Target URL:** `/inventory/:deviceId` (Lifecycle tab)

## User Story

As an operations manager or field technician, I want to see the complete lifecycle of a device on one screen — including firmware deployments, service orders, ownership changes, status transitions, and audit events — so that I can understand the device's full story without navigating between multiple tabs or screens.

## Preconditions

- Device detail page exists at `/inventory/:deviceId` (Epic 3)
- Audit trail infrastructure is live (Epic 8 — `AuditLog` entity, Lambda processor writing AUDIT# records)
- CDC provider interface exists (Story 20.8 — `ICDCProvider.getChangeHistory(entityId, timeRange)`)
- Firmware assignment history is queryable per device (Story 26.9 — `FirmwareAssignment` with `previousFirmwareVersion`)
- Service order history is queryable per device (Epic 5)
- RBAC roles and page access are defined in `src/lib/rbac.ts`

## Context / Business Rules

- **Composition, not capture:** This story MUST NOT introduce a new write path for device events. All events displayed in the timeline are read from existing systems of record (AuditLog, CDCEvent, FirmwareAssignment, ServiceOrder, DigitalTwinSnapshot).
- **Event taxonomy:** Timeline events are classified into five categories — `Firmware` (uploaded/approved/deployed/rolled-back), `Service` (order created/assigned/resolved/closed), `Ownership` (customer reassigned), `Status` (online/offline/maintenance/decommissioned), `Audit` (other entity-level changes not covered above).
- **Newest-first ordering:** Timeline is sorted by event timestamp descending. Ties resolved by event type priority (Firmware > Service > Ownership > Status > Audit).
- **Clickable provenance:** Each event node links to its source entity — firmware version detail, service order detail, audit log entry, etc.
- **Retention alignment:** Timeline honors existing retention policies — 30-day default window for audit events, 180-day for Digital Twin snapshots, unbounded for FirmwareAssignment and ServiceOrder. User can extend window via date-range selector.
- **No new data entity:** The unified view uses a **view-model** (`DeviceLifecycleEvent`) that is projected in the UI layer from the existing sources; it is not persisted.

## Acceptance Criteria

- [ ] AC1: Device detail page (`/inventory/:deviceId`) exposes a new **Lifecycle** tab alongside existing tabs (Overview, Firmware, Service Orders, etc.)
- [ ] AC2: `DeviceLifecycleEvent` view-model type is defined in `src/lib/types.ts` with fields: `id`, `deviceId`, `category` (enum: Firmware/Service/Ownership/Status/Audit), `action`, `actor` (userId + displayName), `timestamp`, `summary`, `sourceEntityType`, `sourceEntityId`, `metadata` (record)
- [ ] AC3: A `useDeviceLifecycle(deviceId, timeRange)` hook is created in `src/lib/hooks/use-device-lifecycle.ts` that aggregates events from: `getChangeHistory()` (CDC/audit), `listFirmwareAssignments(deviceId)`, `listServiceOrdersByDevice(deviceId)`, and returns a merged, sorted `DeviceLifecycleEvent[]`
- [ ] AC4: The Lifecycle tab renders a **vertical timeline** (reuses the pattern from Story 20.6's firmware timeline component) with newest events at top
- [ ] AC5: Each timeline node displays: category icon, color-coded indicator (Firmware = blue, Service = amber, Ownership = purple, Status = teal, Audit = gray), event summary, actor name, relative timestamp (e.g., "3 days ago"), and an expandable detail section
- [ ] AC6: Clicking a timeline node navigates to the source entity (firmware version page, service order detail, audit log entry, etc.)
- [ ] AC7: A date-range selector (default: last 30 days; options: 7d / 30d / 90d / 180d / all) reloads the timeline with the selected window
- [ ] AC8: A category filter (multi-select: Firmware, Service, Ownership, Status, Audit) filters visible events without refetching
- [ ] AC9: Page shows skeleton loading states while the aggregate query resolves
- [ ] AC10: If any source query fails, a partial result is shown with a warning banner indicating which sources were unavailable (resilience — no single failure blanks the timeline)
- [ ] AC11: Unit tests cover the aggregation logic in `useDeviceLifecycle` with ≥ 85% coverage including merge ordering, partial-failure handling, and empty-state
- [ ] AC12: CSV export button exports the currently-filtered timeline events (columns: timestamp, category, action, actor, summary, sourceEntityType, sourceEntityId) — reuses the export pattern from `audit-log-tab.tsx`

## UI Behavior

- Tab is labeled "Lifecycle" and uses a clock-with-arrow icon (lucide `History`)
- Timeline is a vertical stepper anchored to the left of the content area; event details expand inline to the right
- Each timeline node is compact: 48px high when collapsed, expands on click
- Category icons use existing lucide icons: `Cpu` (Firmware), `Wrench` (Service), `Users` (Ownership), `Activity` (Status), `FileText` (Audit)
- Color indicators are 4px-wide vertical bars next to each node — not full-background colors, to preserve enterprise density
- Date-range selector and category filter are in a sticky toolbar above the timeline
- Mobile (< 768px): timeline collapses to an accordion; date-range becomes a sheet selector
- Empty state: "No lifecycle events in this window" with a suggestion to widen the date range
- Loading state: 6 skeleton nodes of varying height
- Error state: inline warning banner above the timeline, does NOT replace it

## Out of Scope

- Persona-based filtering of the timeline (Story 27.2)
- Ownership-change dedicated view with chain-of-custody export (Story 27.3)
- Status-transition dedicated analytics view (Story 27.5)
- PDF export of the lifecycle (deferred — CSV is sufficient for this story)
- Real-time WebSocket updates of the timeline (CDC subscription is Story 20.8; this story uses `getChangeHistory` for point-in-time reads)
- Lifecycle events for entities OTHER than devices (firmware lifecycle is Story 20.6; service order history is Epic 5)
- Editing or deleting lifecycle events (events are immutable by design)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for aggregation algorithm, view-model mapping, and error-boundary strategy (to be authored alongside this story).

## Dev Checklist (NOT for QA)

1. Add `DeviceLifecycleEvent` type and `DeviceLifecycleCategory` enum to `src/lib/types.ts`
2. Create `src/lib/hooks/use-device-lifecycle.ts` with TanStack Query `useQueries` aggregating the 3+ source queries
3. Create `src/app/components/devices/device-lifecycle-tab.tsx` containing the timeline, filters, and export button
4. Create `src/app/components/devices/device-lifecycle-timeline.tsx` (reusable timeline component; consider whether to extract a shared `TimelineRail` component if patterns align with Story 20.6 firmware timeline)
5. Create `src/app/components/devices/device-lifecycle-filters.tsx` (date-range + category filter toolbar)
6. Wire the Lifecycle tab into the device detail page tab list
7. Add CSV export helper — reuse `exportAuditLogsToCsv` pattern from Story 8.4
8. Write unit tests in `src/__tests__/hooks/use-device-lifecycle.test.ts` covering: merge ordering, partial failure (one source 500s), empty state, large result pagination
9. Write component tests for timeline rendering, filtering, empty state
10. Add Storybook stories for `DeviceLifecycleTimeline` (empty, loading, mixed events, partial-failure states)

## AutoGent Test Prompts

1. **AC1 — Tab presence:** "Navigate to `/inventory/device-001`. Verify a 'Lifecycle' tab is visible. Click it. Verify URL hash or query reflects the active tab."

2. **AC2-AC3 — Aggregation:** "Call `useDeviceLifecycle('device-001', { range: '30d' })` from a test harness. Verify the returned array contains events from at least 3 distinct `sourceEntityType` values (firmware assignments, service orders, audit entries). Verify events are sorted by `timestamp` descending."

3. **AC4-AC5 — Timeline rendering:** "On the Lifecycle tab for device-001, verify a vertical timeline is rendered. Verify at least 5 event nodes are visible. Verify each node shows a category icon, color indicator, summary, actor name, and relative timestamp. Click a node. Verify it expands to show additional detail fields."

4. **AC6 — Deep link:** "On the Lifecycle tab, locate a Firmware-category event. Click its 'View firmware version' link. Verify navigation to `/deployment/firmware/:familyId` with the correct version pre-selected."

5. **AC7-AC8 — Filtering:** "On the Lifecycle tab, set date range to '7d'. Verify only events from the last 7 days are visible. Deselect the 'Audit' category. Verify Audit-category events disappear without a network refetch."

6. **AC9-AC10 — Resilience:** "Simulate a 500 error from `listServiceOrdersByDevice`. Navigate to the Lifecycle tab. Verify a warning banner shows 'Service order history unavailable'. Verify Firmware and Audit events still render."

7. **AC12 — Export:** "On the Lifecycle tab with a 30d filter, click 'Export CSV'. Verify a CSV file downloads. Verify column headers match AC12. Verify row count equals the number of currently-filtered events."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test for Lifecycle tab navigation, filtering, and CSV export
- [ ] Storybook stories published for `DeviceLifecycleTimeline`
- [ ] Responsive layout verified (desktop, tablet, mobile)
- [ ] WCAG 2.1 AA — timeline is keyboard-navigable; date-range selector is screen-reader accessible
- [ ] No new database tables introduced (composition-only verified)
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

# Story 27.3: Device Ownership / Custody Chain View

**Epic:** Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline
**Phase:** PHASE 2: DERIVED VIEWS
**Persona:** Raj (Operations Manager) / Admin / Compliance Officer
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** #419
**Target URL:** `/inventory/:deviceId` (Ownership tab)

## User Story

As an operations manager or compliance officer, I want to see the complete chain of custody for a device — every customer, site, and responsible party it has been associated with, with effective dates and the user who made each transfer — so that I can produce warranty, insurance, and NIST SR-11 / CM-8 compliance evidence on demand.

## Preconditions

- Device entity has a `customerId` field (Epic 3)
- Optional `siteId` field may exist if Story 20.7 (Customer & Site Entity Model) has landed
- Audit trail captures all `Device` updates including `customerId` changes (Epic 8 — Lambda processor writes AUDIT# records for every update)
- `getChangeHistory(entityId, { fields: ['customerId', 'siteId'] })` is queryable via the CDC provider (Story 20.8)

## Context / Business Rules

- **No new table:** The ownership chain is a **projection** over the existing audit log. We are NOT creating a separate `DeviceOwnership` table. Every ownership change was already captured when `customerId` was updated.
- **Derived record shape:** Each ownership record in the chain represents a **half-open interval** `[startAt, endAt)` during which the device was assigned to a specific customer (and optionally site). `endAt` is null for the current (active) assignment.
- **Transfer reason — optional enhancement:** When a user changes `customerId` via the UI, the app SHOULD prompt for an optional transfer reason (free text, max 500 chars). If captured, it is stored on the audit log entry's `metadata.transferReason`. This is additive and non-blocking — existing transfers without a reason render as "Reason not recorded".
- **Compliance-relevant fields:** The chain view surfaces: `customer`, `site` (if available), `startAt`, `endAt`, `durationDays`, `transferredBy` (user who made the change), `transferReason`.
- **Export artifact:** The chain is exportable as CSV (reused pattern from Story 8.4) AND as a signed PDF "Chain of Custody Report" is **out of scope for this story** (deferred — CSV is sufficient; PDF can be a follow-up).
- **Current device must always appear:** If the device has never changed ownership, the chain shows a single open-ended record from the device's `createdAt` to "present".

## Acceptance Criteria

- [ ] AC1: Device detail page exposes a new **Ownership** tab (next to the Lifecycle tab from Story 27.1)
- [ ] AC2: A `DeviceOwnershipRecord` view-model type is added to `src/lib/types.ts` with fields: `customerId`, `customerName`, `siteId?`, `siteName?`, `startAt`, `endAt?`, `durationDays`, `transferredBy` (userId + displayName), `transferReason?`
- [ ] AC3: A `useDeviceOwnershipChain(deviceId)` hook in `src/lib/hooks/use-device-ownership-chain.ts` derives the chain by: (a) calling `getChangeHistory(deviceId, { fields: ['customerId', 'siteId'] })`, (b) grouping consecutive identical assignments, (c) computing half-open intervals, (d) enriching with customer/site display names
- [ ] AC4: The Ownership tab renders a **horizontal flow** (left-to-right) OR a vertical list showing the full chain. Default is vertical list on mobile, horizontal on desktop.
- [ ] AC5: Each ownership record displays: customer badge, site (if any), start date, end date (or "Current"), duration (e.g., "2 years, 3 months"), transferred-by user, and expandable transfer reason
- [ ] AC6: If the device has never changed ownership, the view renders a single record with a neutral indicator "No ownership changes recorded"
- [ ] AC7: When the user initiates a customer reassignment from the device detail page (existing edit flow), a **Transfer Reason** textarea is added to the form. Submitting captures the reason in the audit log metadata.
- [ ] AC8: CSV export exports the full chain with all fields from AC2
- [ ] AC9: The view respects RBAC — Technicians and Viewers do NOT see the Ownership tab (ownership is Manager/Admin/CustomerAdmin scope). CustomerAdmin sees only records where their customer was the assignee.
- [ ] AC10: Unit tests cover: empty chain, single-assignment chain, multi-transfer chain, missing transfer reason handling, CustomerAdmin scoping — with ≥ 85% coverage

## UI Behavior

- Tab is labeled "Ownership" with a `Users` lucide icon
- Each record is a card with a colored left border (blue for active, gray for historical)
- Timeline layout on desktop: cards stack horizontally with arrow connectors between them, newest on the right
- Mobile layout: cards stack vertically, newest at top
- Transfer reason is collapsed by default; expands on click with fade-in
- "Transferred by" includes the user's avatar (if available) and display name, linking to the user profile page if RBAC permits
- Transfer Reason textarea (AC7): placeholder "Reason for transfer (optional, e.g., 'warranty replacement', 'customer migration')"
- CSV export button is placed in the top-right of the tab, consistent with Lifecycle tab

## Out of Scope

- Signed PDF chain-of-custody report (deferred — CSV is the first deliverable)
- Bulk ownership transfer across multiple devices (enterprise feature, future story)
- Ownership transfer approval workflow (future story — current behavior is immediate change with audit)
- Tracking device CUSTODY at the individual-technician level (only customer + site in this story)
- Historical customer display names that have since been renamed (we display current customer name; historical name can be inferred from audit log raw data for compliance)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for the chain-derivation algorithm and CustomerAdmin scoping strategy.

## Dev Checklist (NOT for QA)

1. Add `DeviceOwnershipRecord` type to `src/lib/types.ts`
2. Create `src/lib/hooks/use-device-ownership-chain.ts` — query + derivation + enrichment
3. Add a unit-testable pure function `deriveOwnershipChainFromAuditLog(events, deviceCreatedAt)` in `src/lib/mappers/device-ownership.mapper.ts`
4. Create `src/app/components/devices/device-ownership-tab.tsx`
5. Create `src/app/components/devices/device-ownership-card.tsx` (single record renderer)
6. Extend existing device-reassignment form to include "Transfer Reason" textarea
7. Wire audit-log write path to include `metadata.transferReason` when provided (coordinate with Epic 8 audit processor — verify it passes through `metadata`)
8. Add RBAC gate for Ownership tab visibility using `canAccess('device.ownership', role)` — may require adding this action to `rbac.ts`
9. Add CustomerAdmin filtering to `useDeviceOwnershipChain`
10. CSV export helper
11. Unit tests in `src/__tests__/mappers/device-ownership.mapper.test.ts` and `src/__tests__/hooks/use-device-ownership-chain.test.ts`
12. Storybook stories for empty chain, single, multi-transfer, with/without reasons

## AutoGent Test Prompts

1. **AC1 — Tab visibility:** "As an Admin, navigate to `/inventory/device-001`. Verify the 'Ownership' tab is visible. Log out. Log in as a Technician. Navigate to the same device. Verify the Ownership tab is NOT visible."

2. **AC3-AC5 — Chain derivation:** "Seed device-005 with audit history: created for customer-A on 2024-01-01, transferred to customer-B on 2024-06-15, transferred to customer-A again on 2025-02-01. Open its Ownership tab. Verify 3 records appear, in correct chronological order, with durations: ~5.5 months, ~7.5 months, and 'Current'."

3. **AC6 — Single record:** "For a device with no ownership changes, open the Ownership tab. Verify a single record is shown with start date = device `createdAt`, end date = 'Current', and the 'No ownership changes recorded' indicator."

4. **AC7 — Transfer reason capture:** "As an Admin, open the customer reassignment form for device-010. Verify a 'Transfer Reason' textarea is present. Enter 'warranty replacement'. Submit. Navigate to the Ownership tab. Verify the new record displays 'warranty replacement' in the expandable reason section."

5. **AC8 — CSV export:** "Open device-005 Ownership tab. Click Export CSV. Verify download occurs. Open the CSV. Verify columns: customerId, customerName, siteId, siteName, startAt, endAt, durationDays, transferredBy, transferReason. Verify row count = chain length."

6. **AC9 — CustomerAdmin scoping:** "Seed device-020 with transfers across customer-A → customer-B → customer-C. Log in as a CustomerAdmin of customer-B. Open device-020. Verify only the customer-B assignment record is visible."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test for chain display, transfer with reason, CSV export, RBAC scoping
- [ ] Storybook stories published for all chain shapes
- [ ] Responsive layout verified (desktop horizontal, mobile vertical)
- [ ] WCAG 2.1 AA — cards keyboard-focusable, reason-expand has proper aria
- [ ] No new database tables introduced (derivation-only verified)
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

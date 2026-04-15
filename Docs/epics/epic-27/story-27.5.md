# Story 27.5: Device Status Transition History

**Epic:** Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline
**Phase:** PHASE 2: DERIVED VIEWS
**Persona:** Raj (Operations Manager) / Field Technician
**Priority:** P1
**Story Points:** 3
**Status:** New
**GitHub Issue:** #421
**Target URL:** `/inventory/:deviceId` (Status tab, OR Lifecycle tab enrichment)

## User Story

As an operations manager, I want to see the full history of a device's status transitions (online, offline, maintenance, decommissioned) with duration in each state and the actor/source that triggered each change, so that I can diagnose stability patterns, detect flapping, and prove operational availability for SLAs.

## Preconditions

- Device entity has a `status` field using the `DeviceStatus` enum (online / offline / maintenance / decommissioned) in `src/lib/types.ts`
- Audit trail captures every `Device.status` change (Epic 8)
- `getChangeHistory(deviceId, { fields: ['status'] })` is queryable via CDC provider (Story 20.8)
- Story 27.1 (device lifecycle timeline) is complete — this story may render either as a dedicated Status tab OR as an enriched Status-category view within the existing Lifecycle tab (see AC1)

## Context / Business Rules

- **No new field capture:** Status transitions are already recorded by the audit log whenever `Device.status` is updated. This story derives a **projection** and does not add new writes.
- **Half-open intervals:** Each transition produces a record `[startAt, endAt)` where the device was in one status. `endAt` is null for the current status.
- **Actor + source taxonomy:** Each transition is tagged with its `source`:
  - `user` — a human changed the status via UI (actor = userId)
  - `system` — automated heuristic (e.g., heartbeat-timeout detector changed status from online → offline; actor = "system")
  - `device` — the device itself reported a status change (e.g., maintenance mode entered from device-side)
  - `unknown` — source can't be determined (legacy records)
- **Flapping detection:** A helper computes the count of transitions in the last 24 hours. If > 5, the record is flagged with a "flapping" indicator — useful for ops dashboards.
- **Availability metric:** For any selected time window, show the percentage of time the device was in `online` status. Formula: `sum(online durations) / total window duration × 100`.
- **Decommissioned is terminal:** Once a device transitions to `decommissioned`, subsequent changes are unusual and should be flagged (visual warning in the view). No enforcement — just visibility.
- **Small display surface:** Prefer enriching the existing Lifecycle tab with a "Status Summary" panel rather than creating a new top-level tab — UX clarity.

## Acceptance Criteria

- [ ] AC1: A **Status Summary panel** is added to the top of the device Lifecycle tab (Story 27.1), above the timeline. The panel displays: current status (badge), time-in-current-status, availability % for the selected window, and a flapping indicator if applicable.
- [ ] AC2: A `DeviceStatusTransition` view-model type is added to `src/lib/types.ts` with fields: `status` (DeviceStatus enum), `startAt`, `endAt?`, `durationMs`, `actor` (userId or 'system' or 'device' or 'unknown'), `source` (enum: user/system/device/unknown), `reason?` (if stored in metadata)
- [ ] AC3: A `useDeviceStatusHistory(deviceId, timeRange)` hook in `src/lib/hooks/use-device-status-history.ts` derives transitions by: (a) calling `getChangeHistory(deviceId, { fields: ['status'] }, timeRange)`, (b) grouping consecutive same-status records, (c) computing half-open intervals and durations
- [ ] AC4: A pure helper `computeAvailability(transitions, window): number` returns the online-percentage for the window, unit-tested for edge cases (empty, always-online, always-offline, window-spanning-transitions)
- [ ] AC5: A pure helper `detectFlapping(transitions, windowMs): { count: number; isFlapping: boolean }` returns transition count in the last N ms and whether it exceeds the flapping threshold (default 5)
- [ ] AC6: Within the Lifecycle timeline, Status-category events are enriched with duration (e.g., "online → offline (was online for 4 days 3 hours)") — the duration is computed in the view-model
- [ ] AC7: When the device's current status is `decommissioned`, the Status Summary panel shows a muted "Decommissioned" indicator and the availability % is not calculated (N/A displayed)
- [ ] AC8: CSV export of status transitions is available (columns: status, startAt, endAt, durationMs, actor, source, reason)
- [ ] AC9: Unit tests cover: empty history, single-status history, multi-transition history, availability math, flapping detection, decommissioned state handling — with ≥ 85% coverage

## UI Behavior

- Status Summary panel is a compact row at the top of the Lifecycle tab — no vertical sprawl
- Current status badge uses existing status color tokens (green / gray / amber / slate)
- Time-in-current-status displays as relative string ("for 4 days 3 hours")
- Availability % is rendered with a sparkline-thin bar showing online vs non-online proportion for the window
- Flapping indicator: small amber chip "⚡ Flapping (6 changes in 24h)" — uses existing alert-style chip component
- Decommissioned indicator: muted gray chip "Decommissioned" with the date
- Status transitions in the timeline (from Story 27.1) gain a duration suffix and an actor-source icon (user silhouette, gear for system, chip icon for device)
- CSV export button: reuse toolbar pattern from Lifecycle tab (not a separate button bar)

## Out of Scope

- Configurable flapping threshold per device (hardcoded to 5/24h in this story)
- Alerting on flapping (notifications / email / pager) — future story
- Status transition approval workflow
- Historical actor display names that have since been renamed (use current user record)
- Separate Status tab (we're enriching Lifecycle tab, not creating a new tab)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for availability calculation edge cases and flapping threshold rationale.

## Dev Checklist (NOT for QA)

1. Add `DeviceStatusTransition` type to `src/lib/types.ts`
2. Create `src/lib/hooks/use-device-status-history.ts`
3. Create `src/lib/mappers/device-status.mapper.ts` with pure derivation + `computeAvailability` + `detectFlapping` helpers
4. Create `src/app/components/devices/device-status-summary.tsx` (Status Summary panel)
5. Wire the Status Summary panel into `device-lifecycle-tab.tsx` (from Story 27.1)
6. Enrich the timeline node renderer to show status transition duration and actor-source icon
7. Extend mock API provider and audit data so at least one device has a realistic status history including a flapping scenario
8. CSV export helper extending the Lifecycle CSV export
9. Unit tests in `device-status.mapper.test.ts` and `use-device-status-history.test.ts`
10. Storybook: "Stable device", "Flapping device", "Decommissioned device" variants of the summary panel

## AutoGent Test Prompts

1. **AC1 — Summary panel presence:** "Navigate to `/inventory/device-001` Lifecycle tab. Verify a Status Summary panel is visible above the timeline. Verify it shows current status badge, time-in-current-status, and availability percentage."

2. **AC3-AC4 — Availability calculation:** "Seed device-030 with history: online from Jan 1 to Jan 10, offline Jan 10 to Jan 12, online Jan 12 to Jan 20. Set window to Jan 1–Jan 20 (20 days). Verify availability % = ((9 + 8) / 20) × 100 = 85%. Allow ±0.5% floating-point tolerance."

3. **AC5 — Flapping detection:** "Seed device-031 with 6 status changes within the last 23 hours. Open its Lifecycle tab. Verify flapping indicator appears with count '6 changes in 24h'. Seed device-032 with 4 changes in the same window. Verify no flapping indicator."

4. **AC6 — Duration in timeline:** "Open device-001 Lifecycle timeline. Locate a status transition event (e.g., online → offline). Verify the event summary includes duration text (e.g., 'was online for 4 days 3 hours')."

5. **AC7 — Decommissioned handling:** "Mark device-099 as decommissioned. Open Lifecycle tab. Verify Status Summary shows 'Decommissioned' chip and availability = 'N/A'."

6. **AC8 — CSV export:** "Click CSV export. Open the file. Verify columns match AC8 and row count equals the number of transitions."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test for Status Summary panel and flapping indicator
- [ ] Mock data includes a flapping device and a decommissioned device
- [ ] Storybook variants published
- [ ] WCAG 2.1 AA — status badges and chips have screen-reader text
- [ ] No new database tables introduced (derivation-only verified)
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

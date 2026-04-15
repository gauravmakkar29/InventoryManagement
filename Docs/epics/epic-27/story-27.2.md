# Story 27.2: Persona-Aware Timeline Filtering

**Epic:** Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline
**Phase:** PHASE 1: COMPOSITION
**Persona:** All personas (Admin, Manager, Technician, Viewer, CustomerAdmin)
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** #418
**Target URL:** `/inventory/:deviceId` (Lifecycle tab)

## User Story

As a user of any role, I want the device lifecycle timeline to pre-filter to the events most relevant to my job, so that I see only what I need to act on without manually dismissing noise I don't care about — and so that sensitive events are hidden from roles that shouldn't see them.

## Preconditions

- Story 27.1 is complete (`DeviceLifecycleEvent` view-model + `useDeviceLifecycle` hook)
- RBAC roles are defined in `src/lib/rbac.ts` — Admin, Manager, Technician, Viewer, CustomerAdmin
- `useCurrentUser()` or equivalent hook exposes the current user's role

## Context / Business Rules

- **One event stream, many lenses:** Persona filtering is a VIEW concern, not a data concern. The same `useDeviceLifecycle` query feeds every persona; the filter runs in the UI layer.
- **Persona → default category map:**
  - **Technician** → Firmware + Service + Status (operational events; no ownership visibility, minimal audit)
  - **Manager** → Firmware + Service + Status + Ownership (operational + business)
  - **Admin** → all five categories (full visibility)
  - **Viewer** → Firmware + Service + Status (read-only operational snapshot)
  - **CustomerAdmin** → Firmware + Service + Ownership (scoped to their customer; no cross-tenant audit leakage)
- **Hard RBAC enforcement:** Filters that hide events are NOT a substitute for authorization. The API provider for `getChangeHistory` MUST already respect RBAC (Story 20.8 + Epic 8). Persona filtering here only hides events the user IS allowed to see but probably doesn't want.
- **Override allowed:** User can re-enable any category they are permitted to see. The persona default is a starting preset, not a lock.
- **Persistence:** User's last category filter selection per device page is persisted in localStorage under key `lifecycle.filter.<role>` so returning users get their last view.
- **No new permissions:** This story does NOT introduce new RBAC actions. It reuses existing role enums.

## Acceptance Criteria

- [ ] AC1: On initial render of the Lifecycle tab, category filter is pre-set according to the current user's role per the persona → default category map
- [ ] AC2: A `getDefaultLifecycleCategories(role: UserRole): DeviceLifecycleCategory[]` helper is defined in `src/lib/rbac.ts` (or colocated `rbac-lifecycle.ts`) and unit-tested for all 5 roles
- [ ] AC3: User can toggle any category on/off within the set of categories their role is permitted to see
- [ ] AC4: If a user's role is NOT permitted to see a category (e.g., CustomerAdmin + Audit), that category checkbox is rendered **disabled** with a tooltip "Not available for your role", not hidden (transparency > magic)
- [ ] AC5: The user's filter selection per device is persisted to localStorage (key: `lifecycle.filter.${role}.${deviceId}`) and restored on re-visit
- [ ] AC6: A "Reset to default" button restores the persona-default selection and clears localStorage entry for that device
- [ ] AC7: Filter changes do NOT refetch data — filtering happens client-side over the already-fetched `DeviceLifecycleEvent[]`
- [ ] AC8: Unit tests cover: default category selection for each role, toggle behavior, permission-gated disabling, localStorage persistence, reset action — with ≥ 85% coverage
- [ ] AC9: E2E test verifies that logging in as a Technician vs Admin on the same device yields different default timeline views

## UI Behavior

- Category filter remains the same component from Story 27.1, enhanced with:
  - Persona-default selection applied on first render
  - Disabled state for non-permitted categories, with hover tooltip
  - Small "Reset to default" text button next to the filter
  - Subtle "Showing default view for [Role]" helper text below the filter on first load (fades after 5s)
- No change to the timeline rendering itself — still a simple client-side filter
- Accessibility: disabled categories are keyboard-focusable with `aria-disabled="true"` and the tooltip is announced by screen readers

## Out of Scope

- Introducing new RBAC actions or modifying permission matrices (out of scope — reuse existing `src/lib/rbac.ts`)
- Server-side filtering of `getChangeHistory` results by role (that's the responsibility of the API provider, already covered by Story 20.8 + Epic 8)
- Per-user custom persona overrides (admin users cannot customize what a Technician sees by default — that's a future configurability story)
- Cross-device filter presets (filter is per-device; no "apply to all devices" flag)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for the persona → category mapping rationale and localStorage key convention.

## Dev Checklist (NOT for QA)

1. Add `getDefaultLifecycleCategories(role)` and `getPermittedLifecycleCategories(role)` helpers to `src/lib/rbac.ts` (or `src/lib/rbac-lifecycle.ts`)
2. Extend `device-lifecycle-filters.tsx` to consume the helpers and apply defaults
3. Add localStorage read/write with debounce (150 ms) to avoid excessive writes during rapid toggling
4. Add "Reset to default" button and wire it to clear localStorage + reapply default
5. Add disabled-category visual + `aria-disabled` treatment and tooltip
6. Write unit tests in `src/__tests__/lib/rbac-lifecycle.test.ts`
7. Write component tests for filter default application, persist/restore, disabled behavior
8. Update Storybook: add stories "as Technician", "as Admin", "as CustomerAdmin" variants

## AutoGent Test Prompts

1. **AC1-AC2 — Persona defaults:** "Mock current user role as 'Technician'. Render the Lifecycle tab. Verify the category filter has Firmware, Service, and Status checked by default; Ownership and Audit unchecked."

2. **AC3-AC4 — Toggle + permission gate:** "As a CustomerAdmin, verify the Audit category checkbox is rendered but disabled with tooltip 'Not available for your role'. Attempt to click it. Verify state does not change."

3. **AC5-AC6 — Persistence + reset:** "As a Manager, toggle off the Ownership category. Refresh the page. Verify Ownership remains unchecked. Click 'Reset to default'. Verify Ownership returns to checked and localStorage entry is cleared."

4. **AC7 — Client-side filtering:** "With the Lifecycle tab loaded, open browser network tab and clear its log. Toggle the Service category off. Verify no new network request is sent. Verify Service events disappear from the timeline."

5. **AC9 — Role differentiation E2E:** "Log in as Technician. Open device-001 Lifecycle. Count visible events. Log out. Log in as Admin. Open device-001 Lifecycle. Count visible events. Verify Admin count ≥ Technician count and includes Audit-category events."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test covering role-based default filtering
- [ ] Storybook role variants published
- [ ] WCAG 2.1 AA — disabled checkboxes are keyboard-focusable and screen-reader-accessible
- [ ] No changes to RBAC permission matrix
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

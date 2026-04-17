# Story 19.1: Approval-First Entity View

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Approver (generic role — the person with authority to approve/reject the entity)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/{entity-type}/{entity-id}` (the entity's own detail page is the approval surface)

## User Story

As an **Approver**, I want to open an **entity's own page** and see every downstream item affected by my decision, so that I can approve or reject the entity _once_ and have the decision propagate to all affected items — instead of making the same decision per item across potentially thousands of rows.

## Preconditions

- An "entity" type exists that can be approved (firmware, policy, release, configuration, document template, etc.) — the pattern is agnostic to which.
- The entity has a relational link to **zero-to-many "downstream items"** that inherit its approved state (devices running that firmware, users subject to a policy, services consuming a configuration, etc.).
- A backend query exists that answers `getApplicableItemsFor(entityId)` → `Item[]`.
- The user's role permits approval per existing RBAC.

## Context / Business Rules

- **The entity is the primary actor, not the item.** All approval UX lives on the entity's page. Item-level pages may _display_ approval state read-only, but they must not be the place where approval happens.
- **One decision, many effects.** When the Approver takes an action, the decision is applied to the entity — the downstream items inherit it through their relational link at query time. No per-item writes.
- **Applicable-items list must be visible before approval.** The Approver must see "this decision will affect N items" prior to clicking Approve. No hidden blast radius.
- **Filter & paginate the items list.** Downstream item lists can be large (thousands). Filter + pagination is mandatory.
- **Read-only back-link from items.** An item's own page must link to the entity's approval page so an operator investigating an item can reach the approval context in one click.

## Acceptance Criteria

- [ ] AC1: Entity detail page at `/{entity-type}/{entity-id}` exposes a dedicated **Approval** section (card or tab) as the primary call-to-action when the entity is in a pending-approval state.
- [ ] AC2: The Approval section displays the entity's current approval status, the allowed next transitions, and any prerequisites (linked artifacts, outstanding reviews).
- [ ] AC3: The Approval section displays an **Applicable Items** subsection listing every downstream item the decision will affect, with count in the header (e.g., "Applicable items: 2,340").
- [ ] AC4: The Applicable Items list supports free-text search, at least one filter dimension (status / category / tag), and paginated rendering (50 per page).
- [ ] AC5: Clicking **Approve** or **Reject** emits a single write against the entity; no per-item writes are performed.
- [ ] AC6: After approval, the entity's downstream items reflect the new state on their next read — no item-level backfill job is required.
- [ ] AC7: An item's own detail page shows a read-only approval-state pill and a link back to the entity's Approval section.
- [ ] AC8: A confirmation dialog appears before the write, showing "You are about to {action} this {entity-type}. This will affect N items." with a final confirm button.
- [ ] AC9: If the Approver's role does not grant permission, the Approve / Reject buttons render disabled with a tooltip explaining the missing permission.
- [ ] AC10: Unit tests cover the `getApplicableItemsFor(entityId)` query, the approval mutation, and the read-only projection to item pages, with ≥ 85% coverage.

## UI Behavior

- Approval section is visually prominent (card with border + header), not buried in a tab.
- Applicable Items list uses compact-density rows (default 50 per page; adjustable in view settings).
- Approve is the primary button (filled); Reject is secondary (outline); destructive actions require double confirmation.
- Status pill uses consistent colour across entity page and item back-links.
- Loading state: skeleton rows in the items list, skeleton text in the status summary.
- Error state: inline banner in the Approval section; the items list is separately fallible and shows its own error without blocking the approval controls.

## Out of Scope

- The specific set of approval stages (drafting → review → approved → deprecated, etc.). That's product-specific — this story only dictates **where** the approval happens.
- Separation-of-duties enforcement (covered by Story 19.2 — Reviewer role with gated status).
- Audit trail of who-approved-what (covered elsewhere — this pattern assumes a generic audit sink exists).
- Item-level overrides (some items exempt from the entity's state) — optional extension, not baseline.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `IApprovalSurface<Entity, Item>` typed contract, the `useApprovalSurface` hook pattern, and the standard `<ApprovalSection />` React component contract.

## Dev Checklist (NOT for QA)

1. Define a generic `IApprovableEntity<ItemType>` interface in the template's types module.
2. Add a `getApplicableItemsFor(entityId)` method to the provider interface for the entity type (extends the existing data-layer provider pattern).
3. Create a reusable `<ApprovalSection entity item={…} />` component under the template's shared components folder.
4. Create a reusable `<ApplicableItemsList />` component with built-in search, filter, pagination.
5. Wire the confirmation dialog through an existing `<ConfirmDialog />` primitive.
6. Add a read-only `<ApprovalStatePill />` component for item pages and back-link.
7. Add unit tests for the generic pattern with a throwaway "TestEntity" fixture.
8. Publish Storybook stories for ApprovalSection, ApplicableItemsList, ApprovalStatePill.

## AutoGent Test Prompts

1. **AC1-AC3 — Approval surface present.** "Open a fixture entity in pending state at `/{type}/{id}`. Verify an Approval section is visible, shows the current status, and displays an Applicable Items subsection with a count greater than zero."
2. **AC4 — Filter & pagination.** "On the Applicable Items list, type a substring into the search. Verify the list filters client-side. Paginate forward; verify a new page of 50 rows loads."
3. **AC5-AC6 — One write, many effects.** "Click Approve. Intercept the network tab. Verify exactly one write request is made against the entity endpoint. Reload an item page that was previously linked; verify its approval-state pill reflects the new state."
4. **AC7 — Read-only back-link.** "On an item detail page, locate the approval-state pill. Click the 'View approval' link. Verify navigation to the entity's Approval section."
5. **AC8 — Confirmation dialog.** "Click Approve. Verify a dialog appears with 'affects N items' text. Cancel. Verify no write was made."
6. **AC9 — RBAC gating.** "Impersonate a role without approval permission. Load the entity page. Verify Approve / Reject buttons are disabled; verify the disabled tooltip is readable by screen reader."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test for approve flow and RBAC gating
- [ ] Storybook stories published for each new shared component
- [ ] Responsive layout verified (desktop, tablet, mobile)
- [ ] WCAG 2.1 AA — Approval section is keyboard-navigable; confirmation dialog traps focus; disabled-button tooltip is announced
- [ ] No per-item write emitted during approval (verified by network assertion in E2E)
- [ ] TypeScript strict — no `any` types
- [ ] Template documentation updated with generic-noun substitution guide

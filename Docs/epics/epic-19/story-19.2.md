# Story 19.2: Reviewer Role with Gated Status

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Reviewer (a role whose sign-off is required before an entity can advance)
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/{entity-type}/{entity-id}` (Reviewer's gated status is surfaced on the entity page alongside the Approval section)

## User Story

As a **Reviewer**, I want to mark a pre-approval check as **Pass / In Progress / Fail** on an entity, so that the entity cannot advance to approved state until I've finished my review — and a **Fail** must block the downstream workflow outright.

## Preconditions

- Story 19.1 (Approval-first entity view) has shipped — the entity has a detail page with an Approval section.
- The template's RBAC system supports a named "Reviewer" role (or equivalent — role name is configurable per adopting product).
- An audit sink exists to log review-status changes.

## Context / Business Rules

- **Reviewer ≠ Approver.** The Reviewer runs a check; the Approver takes the final go/no-go decision. By design these are two different people — single-person sign-off is a compliance anti-pattern.
- **Three states only.** Pass, In Progress, Fail. "Not started" is the absence of the record, not a fourth state. Keeping the state space narrow is deliberate.
- **Fail is a hard gate.** While status is Fail, the entity's Approve button is disabled and the Approver cannot override — only a new Reviewer action can clear it.
- **In Progress is informational.** It shows the Approver that a review is underway and the entity is not ready, but it does not technically block Approve (the Approver can choose to wait).
- **Multiple gated checks are supported.** An entity may have more than one reviewer gate (security, legal, engineering). All must be Pass before Approve is enabled. This story delivers the primitive; products configure the list of gates.
- **Status transitions are logged.** Every Pass / In Progress / Fail write emits an audit record with actor, timestamp, entity ID, and optional reviewer comment.

## Acceptance Criteria

- [ ] AC1: Entity detail page exposes a **Review Gates** area inside or above the Approval section, listing all configured review gates for the entity type (e.g., "Security review", "Legal review").
- [ ] AC2: Each gate row displays: gate name, current status (Pass / In Progress / Fail / Not started), last reviewer, last updated timestamp, and optional reviewer comment.
- [ ] AC3: A user with the Reviewer role for a specific gate sees an editable status dropdown on that gate (Pass / In Progress / Fail) and a free-text comment field; users without that role see the status read-only.
- [ ] AC4: Saving a status change writes the new status, the reviewer user ID, the timestamp, and the comment — and emits an audit event.
- [ ] AC5: While _any_ configured gate is in Fail state, the Approve button in Story 19.1's Approval section is disabled, with tooltip "{Gate name} review failed — clear the gate before approving."
- [ ] AC6: While all configured gates are Pass, the Approve button is enabled (subject to any other prerequisites).
- [ ] AC7: A gate row with In Progress status shows a subtle visual indicator (e.g., pulsing dot) to signal "work happening here".
- [ ] AC8: The Reviewer cannot be the same person as the entity's creator or Approver — attempting to save a status update while logged in as the creator/approver returns a permission error with message "Separation of duties — you cannot review an entity you created or are approving."
- [ ] AC9: Gate configuration (which gates exist, which role gates them) is driven by product config, not hard-coded — the template ships a `<ReviewGate name="…" role="…" />` wiring pattern.
- [ ] AC10: Unit tests cover the gate-status state machine, the SoD enforcement, and the Approve-button gating logic with ≥ 85% coverage.

## UI Behavior

- Review Gates appear as a compact list above or inside the Approval card, each row showing gate name + status pill + last reviewer text.
- Fail status uses the template's error colour; Pass uses success colour; In Progress uses warn colour; Not started is neutral.
- Comment field is an auto-growing textarea (`aria-label="Reviewer comment"`) inline on status change.
- Clicking the reviewer's name opens a user hover-card.
- Mobile: gates stack vertically; editable dropdown uses a bottom-sheet selector.
- When a user without gate permission opens the edit dropdown, it is rendered disabled with an `aria-disabled` tooltip explaining the missing role.

## Out of Scope

- Who _is_ a Reviewer — that's role/permission configuration. This story assumes the role exists.
- Time-bound review requests (e.g., "this review must be completed by Friday") — that's Story 19.4 (Deadline-watch alerting).
- Reviewer assignment workflows (auto-rotating reviewers, round-robin queues) — deferred.
- Review history audit view — separate audit-trail concern; this story only emits the events.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `ReviewGate` data model, the SoD enforcement query, and the `<ReviewGates entityId entityType />` component contract.

## Dev Checklist (NOT for QA)

1. Add `ReviewGate` entity type + `ReviewStatus` enum (Pass / InProgress / Fail) to template types.
2. Extend the entity provider interface with `listReviewGates(entityId)` and `updateReviewGate(entityId, gateName, status, comment)`.
3. Enforce SoD at the provider layer — reject writes where `reviewer === entity.createdBy || reviewer === entity.approver`.
4. Build the `<ReviewGates />` component with per-row editable/read-only rendering based on the current user's roles.
5. Gate the `<ApprovalSection />` Approve button on `every(gates, g => g.status === "Pass")`.
6. Emit audit events for every gate write (reuse the template's existing audit sink).
7. Publish Storybook stories for the Review Gate row in all status states.

## AutoGent Test Prompts

1. **AC1-AC3 — Gates render, role-gated editing.** "Open a fixture entity with two configured gates. Verify both rows render with status. Log in as a user with the Security Reviewer role only. Verify the Security gate dropdown is editable and the Legal gate dropdown is read-only."
2. **AC4 — Status write persists + audit.** "Set Security gate to Pass with a comment. Reload the page. Verify status is Pass, reviewer name is the current user, comment is visible. Query the audit sink for the entity — verify an audit event exists."
3. **AC5-AC6 — Approve button gating.** "Set Security gate to Fail. Verify the Approve button is disabled with the expected tooltip. Set Security gate to Pass; verify Approve becomes enabled."
4. **AC8 — Separation of duties.** "Log in as the user who created the fixture entity. Attempt to set a gate to Pass. Verify the write is rejected with the SoD error message."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] E2E test for gate edit, SoD enforcement, and Approve-button gating
- [ ] Storybook stories published for each gate state
- [ ] WCAG 2.1 AA — status dropdown is keyboard-accessible; comment field has a readable label
- [ ] TypeScript strict — no `any` types
- [ ] Template config documentation includes a worked example of adding a new gate

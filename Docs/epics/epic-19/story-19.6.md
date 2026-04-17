# Story 19.6: Scoped Access-Request Lifecycle

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Requester (low-privilege user requesting scoped access) · Approver (grants / denies)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/access-requests` (approval queue) · `/{entity-type}/{entity-id}` (Request Access button in place of a disabled action)

## User Story

As a **Requester**, I want to request scoped, time-limited access to an entity I don't currently have permission to see, so that I can do my job in exceptional cases — and as an **Approver**, I want a queue to approve / deny those requests, with auto-expiry of any grants I issue.

## Preconditions

- Template RBAC primitive exists (roles + permissions).
- An audit sink exists.
- Notification channel (bell / panel) exists — Story 19.4.

## Context / Business Rules

- **Request shape.** A Requester picks a scope (entity, entity-type + filter, or a named permission), provides a reason, and names a duration (15m / 1h / 4h / 24h / custom). The request is persisted and the Approver is notified.
- **Approval queue.** Pending requests land in an **Access Requests** queue visible to users with the appropriate Approver role. The queue supports approve / deny / request-more-info with a comment.
- **Approval grants an ephemeral permission.** The grant is attached to the Requester, scoped to the requested target, and carries `expires_at`. It is not a role promotion — it is a narrow, time-bounded bolt-on.
- **Auto-expiry.** When `expires_at` passes, the grant is automatically revoked. No background job of high risk — the enforcement check happens at request-authorization time (read path), not via a cron that deletes rows. The grant record is retained for audit.
- **Revocable before expiry.** The Approver (or a superseding role) can revoke an active grant early. Revocation is audited.
- **Re-request.** The Requester can submit a new request after expiry; prior history is visible on their profile.
- **Visibility rule.** Requesters see only their own requests; Approvers see their queue; Auditors see everything read-only.
- **Deny is a first-class outcome, not an absence.** Denied requests are recorded with Approver identity, timestamp, and optional reason, so patterns of denial are auditable.

## Acceptance Criteria

- [ ] AC1: On an entity page where the current user lacks permission, the disabled action button is replaced with a **Request Access** button with tooltip "Requires approval from {Approver role name}".
- [ ] AC2: Clicking Request Access opens a dialog with fields: **Scope summary** (pre-filled from context), **Reason** (required, min 20 chars), **Duration** (select: 15m / 1h / 4h / 24h / Custom up-to 7 days).
- [ ] AC3: Submitting creates an `AccessRequest` record in `pending` state and notifies all users with the target Approver role.
- [ ] AC4: `/access-requests` route renders the approval queue, filterable by state (pending / approved / denied / expired / revoked) and by Requester.
- [ ] AC5: Each queue row shows Requester, scope, duration asked, reason (truncated, expandable), submitted-at timestamp, and actions: Approve / Deny / Request more info.
- [ ] AC6: Approving a request creates a `Grant` record with `expires_at` = now + approved-duration, transitions the request to `approved`, and notifies the Requester.
- [ ] AC7: The authorization layer, on every check, considers the caller's roles **and** any active non-expired Grants scoped to the target.
- [ ] AC8: Denying a request transitions it to `denied`, records Approver identity + optional comment, and notifies the Requester.
- [ ] AC9: Request more info sends the request back to the Requester with a comment; Requester can edit reason/duration and resubmit.
- [ ] AC10: When `expires_at` passes, subsequent authorization checks do not honour the grant. A nightly job transitions the grant record's `state` from `active` to `expired` for querying; the security check itself is clock-based, not state-based.
- [ ] AC11: A **Revoke** action on any active grant transitions it to `revoked`, records Approver identity, and notifies the Requester.
- [ ] AC12: A Requester's profile page shows their request history with each state and a "Request again" shortcut for scopes they've previously used.
- [ ] AC13: Unit tests cover request creation, approval/denial, grant expiry clock-check, and revocation with ≥ 85% coverage.

## UI Behavior

- Request dialog uses template's `<Dialog>` primitive; Duration is a radio-like pill group with the custom option opening a number input.
- Approval queue is a data table with sticky filters.
- Per-row actions use icon buttons for density; confirmation dialogs appear for Approve (with duration summary) and Deny.
- Active grants get a subtle pill on the grantee's session shell ("Elevated: {scope} until {time}") so the user is always aware of elevated-access mode.
- Countdown: last 10 minutes of an active grant show a warning toast and an option to request an extension.
- Accessibility: dialog traps focus, queue is keyboard-navigable, per-row actions announce their effect.

## Out of Scope

- Auto-approve policies ("users with X role get auto-approved for Y scope up to Z duration") — deferred extension.
- Out-of-band approvals (Slack / email approve-by-reply) — deferred.
- Bulk approve ("approve all 10 pending requests from this user") — single-row actions only.
- Administrative per-request audit export — a generic audit query suffices.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `AccessRequest` and `Grant` data models, the authorization-check integration contract (`hasPermission(user, scope)` must consult Grants), and the `<RequestAccessDialog />` / `<AccessRequestQueue />` component interfaces.

## Dev Checklist (NOT for QA)

1. Add `AccessRequest` and `Grant` entity types + their state enums.
2. Extend authorization primitive: `hasPermission` now also consults active, non-expired `Grant` records.
3. Build `<RequestAccessDialog />`, `<AccessRequestQueue />`, and `<ActiveGrantPill />` (shell indicator).
4. Swap disabled action buttons to Request Access variants when the failure reason is "missing permission" (not "entity state forbids").
5. Wire notifications via Story 19.4's alert / notification channel for pending queue and grant expiry.
6. Add the nightly state-sweep job (cosmetic — turns `active` into `expired` in the record; the auth check itself is clock-based).
7. Audit every write: create, approve, deny, revoke, expire.

## AutoGent Test Prompts

1. **AC1-AC3 — Submit a request.** "As a Requester, open an entity page where the primary action is disabled. Verify the Request Access button is visible. Click it; fill Duration=1h, Reason='Investigating incident #X'. Submit. Verify an `AccessRequest` record exists in `pending` and the Approver role receives a notification."
2. **AC4-AC6 — Approve a request.** "As an Approver, open `/access-requests`. Verify the pending request is listed. Approve with default duration. Verify: request transitions to `approved`, a `Grant` is created with correct `expires_at`, Requester is notified."
3. **AC7 — Authorization honours grant.** "Log in as the Requester. Reload the entity page. Verify the previously-disabled action is enabled and operates correctly."
4. **AC10 — Expiry clock check.** "Advance simulated clock past `expires_at`. Attempt the action again. Verify it is rejected with the standard permission error; no grant-related override applies."
5. **AC11 — Revoke.** "As an Approver, revoke the active grant. Verify the Requester's session pill disappears and the action re-disables on next page interaction."
6. **AC12 — Request again.** "On the Requester profile, find the expired request. Click 'Request again'. Verify the dialog pre-fills scope and reason."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] E2E test for submit → approve → use → expire; and submit → deny
- [ ] Storybook stories for RequestAccessDialog, AccessRequestQueue (pending / mixed / empty), ActiveGrantPill
- [ ] WCAG 2.1 AA — dialog traps focus, queue keyboard-navigable
- [ ] Authorization-layer integration tested — grant respected; expiry enforced at read time
- [ ] Every write audited
- [ ] TypeScript strict — no `any`

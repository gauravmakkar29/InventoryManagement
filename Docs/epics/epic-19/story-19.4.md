# Story 19.4: Deadline-Watch Alerting

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Operator (consumer of the alerts) · Approver (owner of the deadline / waiver)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** Alerts surfaced on the Inbox dashboard (Story 19.5), notification bell, and deep-linked into the entity page.

## User Story

As an **Operator**, I want the system to watch **committed dates** across the platform — entity target dates, conditional-waiver due dates, review deadlines — and alert me as those dates approach with any prerequisite still missing, so that I can act before the deadline passes instead of discovering slippage after the fact.

## Preconditions

- Story 19.3 (Artifact waiver) ships — conditional waivers have `due_date` and `expected artifact`.
- Entities may have a first-class committed date (e.g., target go-live, commission date, release date). The template provides a generic `CommittedDate` annotation on any entity.
- A notification-delivery channel exists (in-app; email / push are extensions).

## Context / Business Rules

- **Alert types covered:**
  - **Pre-deadline prerequisites warning** — a committed date is < `warning_window_days` (default 14) away and one or more required artifacts or review gates are still missing.
  - **Conditional-waiver due-date warning** — a conditional waiver's `due_date` is < `waiver_warning_window_days` (default 7) away and the expected artifact is not yet uploaded.
  - **Conditional-waiver overdue** — a conditional waiver's `due_date` has passed and the expected artifact is not uploaded.
  - **Committed-date passed-with-gaps** — the entity's committed date has arrived and prerequisites are still incomplete.
- **Windows are configurable per entity type.** The template exposes `warning_window_days` per `EntityTypeConfig`.
- **Alerts are addressed to a role, not an individual.** E.g., "any Approver for this entity type" — the inbox filters per the current user's roles.
- **Alerts de-duplicate.** The same (entity, alert_type) pair does not fire twice inside a `dedupe_window_hours` (default 24).
- **Alerts auto-clear.** Once the missing prerequisite is supplied or the deadline moves, the alert is marked resolved on next evaluation (no manual dismissal required, though manual dismiss is also supported).
- **Snooze is allowed.** An operator can snooze an alert for a duration (e.g., 24h). Snoozed alerts reappear after the snooze window.
- **Audit.** Every alert raise, resolve, snooze, and dismiss is audit-logged.

## Acceptance Criteria

- [ ] AC1: A background evaluator runs on a schedule (default: every hour) and raises alerts matching the four rules above against all eligible entities.
- [ ] AC2: Alerts are persisted as `Alert` records with fields: `id`, `entityType`, `entityId`, `alertType` (enum), `severity` (info/warning/error), `message`, `targetRoles` (string[]), `state` (active/snoozed/resolved/dismissed), `firstRaisedAt`, `lastEvaluatedAt`, `metadata` (record).
- [ ] AC3: The in-app notification bell displays a count of **active, unresolved** alerts for the current user's roles; clicking it opens an alert panel listing the alerts newest-first.
- [ ] AC4: Each alert in the panel shows: severity icon, title, entity link, age, and per-alert actions (View / Snooze / Dismiss).
- [ ] AC5: Clicking **View** deep-links to the originating entity page with an anchor to the relevant section (e.g., Waivers or Approval).
- [ ] AC6: Clicking **Snooze** opens a small menu (1h / 4h / 24h / Until tomorrow 9am) and transitions the alert to `snoozed`.
- [ ] AC7: Clicking **Dismiss** transitions the alert to `dismissed` and writes an audit event. Dismissed alerts re-raise if the condition persists through the next dedupe window.
- [ ] AC8: When the underlying condition resolves (artifact uploaded, waiver cleared, deadline moved), the alert transitions to `resolved` automatically on the next evaluation.
- [ ] AC9: An alert's dedupe window prevents the same alert from being raised twice inside 24h (configurable).
- [ ] AC10: The evaluator is **idempotent and restartable** — re-running it against the same state produces the same alert set.
- [ ] AC11: Unit tests cover each of the four alert rules, snooze/dismiss/resolve transitions, dedupe, and idempotency with ≥ 85% coverage.
- [ ] AC12: An admin can configure `warning_window_days`, `waiver_warning_window_days`, and `dedupe_window_hours` per entity type via `EntityTypeConfig`.

## UI Behavior

- Notification bell is always visible in the top-right of the shell; badge count is the number of active-unresolved alerts for the user's roles; count is live-updated (poll or subscription).
- Alert panel is a slide-out sheet from the right; alerts are grouped by severity.
- Severity: `error` red, `warning` amber, `info` blue.
- Each alert row is 64px high; title two lines max.
- Snooze menu uses the template's `<DropdownMenu>` primitive.
- Empty state: "No alerts — you're all caught up" with a relaxed illustration.
- Accessibility: panel traps focus; alerts announce severity to screen readers.

## Out of Scope

- Email / SMS / push delivery — extensions. This story delivers the in-app channel only.
- User-authored alert rules (e.g., "alert me when X happens") — dev-owned rules only.
- Real-time subscription transport — poll is baseline; websocket/SSE can be added later.
- Cross-entity correlation ("the same person has 3 overdue waivers") — simple per-entity rules only.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `Alert` data model, the evaluator scheduler, the four rule specifications, and the `<AlertPanel />` component contract.

## Dev Checklist (NOT for QA)

1. Add `Alert` entity, `AlertType` enum, and `AlertState` enum to template types.
2. Add `CommittedDate` annotation on base entity type + `EntityTypeConfig` for configurable windows.
3. Build the `AlertEvaluator` service implementing the four rules, ensuring idempotency via `(entityId, alertType)` unique key inside the dedupe window.
4. Schedule the evaluator via the template's existing job scheduler.
5. Build `<NotificationBell />`, `<AlertPanel />`, `<AlertRow />` components.
6. Wire the "resolve on condition clear" back into artifact-upload and waiver state-change flows.
7. Audit every raise / snooze / dismiss / resolve.
8. Unit-test all four rules with representative fixtures (Committed-date N days out, N-days-past, etc.).

## AutoGent Test Prompts

1. **AC1-AC2 — Pre-deadline warning raised.** "Seed an entity with committed date 7 days from now and a missing required artifact. Run the evaluator. Query alerts — verify one alert exists with type `pre-deadline-prerequisites-warning`, severity `warning`, targetRoles includes the Approver role."
2. **AC3-AC5 — Bell + deep-link.** "Log in as a user with the Approver role. Verify the bell shows a badge count of 1. Click it; verify the panel opens with one alert. Click View; verify navigation to the entity page with the Waivers section scrolled into view."
3. **AC6 — Snooze.** "Snooze the alert for 24h. Verify badge count drops to 0. Advance simulated clock 25h and re-run evaluator. Verify badge count returns to 1."
4. **AC7 — Dismiss.** "Dismiss an alert. Verify audit log contains a dismiss event. Re-run evaluator inside dedupe window; verify alert does not re-raise. Advance past dedupe window; re-run; verify alert re-raises."
5. **AC8 — Auto-resolve.** "On a pre-deadline alert, upload the missing artifact. Re-run the evaluator. Verify the alert transitions to `resolved` and drops out of the panel."
6. **AC10 — Idempotency.** "Run the evaluator three times back-to-back against the same state. Verify the alert set after each run is identical (no duplicates, no flapping)."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage) covering every rule and state transition
- [ ] E2E test for evaluator → bell → snooze → auto-resolve
- [ ] Storybook stories for AlertPanel (empty, one alert, many alerts, mixed severity)
- [ ] WCAG 2.1 AA — bell has accessible-name, panel traps focus, severity announced
- [ ] Evaluator idempotency verified by integration test
- [ ] Config-driven windows documented in template docs
- [ ] TypeScript strict — no `any`

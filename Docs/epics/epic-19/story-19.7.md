# Story 19.7: Upgrade-Available Notification

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Operator (recipient) · Publisher (the actor that publishes a new version)
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** Notification surfaces (bell + panel from Story 19.4) and a dedicated **What's New** landing at `/upgrades`.

## User Story

As an **Operator** responsible for one or more tenants running a watched entity type, I want to be notified when a **new version** of a watched entity is published, so that I can plan an upgrade instead of discovering the availability late or never.

## Preconditions

- A "versionable entity" type exists in the product — any entity whose identity carries a `familyId` (a "lineage") and successive `version` records share that family.
- A "watchlist" mechanism exists or is added by this story — a tenant subscribes to a family, or inherits the subscription by running a version.
- Story 19.4's notification channel is available for delivery.

## Context / Business Rules

- **A tenant is on a version by running it.** The subscription is implicit for tenants currently running any version of the family. Tenants can also opt in explicitly.
- **Notification fires on publication.** When version N+1 is published to the family, every tenant running ≤ N receives one notification per family per published version.
- **Per-tenant delivery, not per-item.** If a tenant runs 10,000 items of the same family, the tenant gets ONE notification for the upgrade — not 10,000.
- **Role-scoped recipients.** Notification goes to users with the Operator / Admin role for that tenant, not to every user.
- **Digest-capable.** A tenant may have "instant" or "daily digest" preference; the template ships with "instant" default and "digest" as a user preference.
- **Severity.** Informational by default. Marked `urgent` if the publisher flags the release as a security fix.
- **De-duplication.** The same (tenant, familyId, newVersion) trio fires once. Reshuffling of tenant membership does not trigger re-fires.
- **Dismissable.** Users can dismiss an upgrade notice per-tenant; reappears if a later version is published.

## Acceptance Criteria

- [ ] AC1: A `WatchedFamily` concept exists: `familyId`, `tenantId`, `currentVersionId`, `autoSubscribed` (bool), `explicitSubscriber` (bool). Subscription is inferred if `currentVersionId` is set; explicit subscription is additive.
- [ ] AC2: When a new version record is persisted against a family, an event `FamilyVersionPublished(familyId, newVersion, severity)` is emitted on the template's internal event bus.
- [ ] AC3: A notification handler consumes the event and raises one notification per tenant currently on an older version of the family.
- [ ] AC4: Recipients for each tenant are users holding the configured `UpgradeNotifyRole` (default: Operator + Admin). The role list is configurable per entity type.
- [ ] AC5: Each notification shows: entity-family label, current tenant version, new published version, severity pill, short summary (from the version's release notes if present), and a primary action **Review Upgrade**.
- [ ] AC6: **Review Upgrade** navigates to `/upgrades/{familyId}` where the tenant sees: current version ↔ new version diff summary, changelog / release notes, impacted-items count for the tenant, and the standard approval path.
- [ ] AC7: A user preference lets the recipient pick `instant` or `daily digest` delivery per entity type.
- [ ] AC8: Dismissing a notification clears it for that user and that tenant; a later version re-raises.
- [ ] AC9: An admin can explicitly subscribe a tenant to a family they don't currently run (e.g., to evaluate upgrades before adopting); explicit subscriptions also receive notifications.
- [ ] AC10: Unit tests cover event → notification fan-out, per-tenant de-dup, urgent severity, and digest-mode batching with ≥ 85% coverage.

## UI Behavior

- Notification in the bell uses an upgrade icon and the severity colour.
- `/upgrades` dashboard lists pending upgrades across the user's tenants, grouped by tenant, with a filter for severity.
- The upgrade review page shows an OLD → NEW header, a changelog card, an impacted-items card with a count and sample rows, and a single "Start upgrade" action that hands off to the template's approval flow (Story 19.1).
- Urgent severity raises a persistent banner on the `/` Inbox until acknowledged.
- Mobile: upgrade review page stacks sections vertically.
- Accessibility: severity announced; changelog content is readable by screen reader.

## Out of Scope

- The actual upgrade execution (applying version N+1 to a tenant) — that's product-specific and reuses existing approval / bulk-decision paths (Story 19.1 and 19.10).
- Release-notes authoring UI — this story consumes release notes, not authors them.
- Cross-tenant aggregation by a super-admin ("see every tenant's upgrade status across all customers") — separate admin-surface story.
- Automatic upgrade without operator review — explicitly out of scope; every upgrade needs human review.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `WatchedFamily` model, the `FamilyVersionPublished` event contract, the notification fan-out query, and the digest batcher.

## Dev Checklist (NOT for QA)

1. Add `WatchedFamily`, `FamilyVersionPublished` event, and `UpgradeNotification` types to template.
2. Add an event handler that performs the fan-out query and emits per-tenant notifications.
3. Add a daily digest batcher that groups instant notifications queued in the last 24h into a single summary notification when user prefs = digest.
4. Build `/upgrades` listing page + `/upgrades/{familyId}` review page.
5. Wire Severity=urgent to also raise an Inbox banner.
6. Add user preference control for delivery mode per entity type.
7. Unit-test fan-out, dedupe, digest packing, explicit-subscription behaviour.

## AutoGent Test Prompts

1. **AC2-AC4 — Fan-out.** "Seed three tenants all running version 1.0 of family F. Publish version 2.0 of family F. Verify three `UpgradeNotification` records exist, one per tenant, addressed to the Operator+Admin roles of each tenant."
2. **AC3 — Per-tenant single notification.** "Seed a tenant that owns 5,000 items of family F at version 1.0. Publish version 2.0. Verify exactly ONE notification was raised for that tenant — not 5,000."
3. **AC5-AC6 — Review upgrade.** "As an Operator with a pending upgrade, click the notification's Review Upgrade action. Verify navigation to `/upgrades/{familyId}`. Verify OLD → NEW labels, changelog, and impacted-items count match expected."
4. **AC7 — Digest mode.** "Set user preference to daily digest. Publish three family versions inside 24h. Run the digest batcher at scheduled time. Verify one combined notification is delivered summarising all three."
5. **AC8 — Dismiss and re-raise.** "Dismiss an upgrade notification. Verify it disappears from the bell. Publish a newer version (3.0) of the same family. Verify a fresh notification is raised."
6. **AC9 — Explicit subscription.** "Subscribe a tenant admin to a family the tenant does not currently run. Publish a new version. Verify the subscriber receives a notification."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] E2E test for publish → fan-out → review-upgrade page
- [ ] Storybook stories for upgrade notification row, `/upgrades` listing, and review page
- [ ] WCAG 2.1 AA — severity announced; OLD vs NEW comparison readable
- [ ] De-dup and digest behaviour verified
- [ ] TypeScript strict — no `any`

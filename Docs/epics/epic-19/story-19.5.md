# Story 19.5: Inbox-Style Dashboard Landing

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Operator (default landing page experience for every logged-in user)
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/` (the post-login home page)

## User Story

As an **Operator**, I want my landing page to show **what I need to act on today**, not a grid of KPI cards, so that every session starts with a clear task list instead of a "read the charts and figure out what to do" hunt.

## Preconditions

- Story 19.4 (Deadline-watch alerting) ships — `Alert` records exist and are queryable by target role.
- A lightweight "assignment" concept exists (the user is explicitly assigned to entities, or the user's role makes them the responsible party).
- KPIs already exist elsewhere in the product (they are not deleted — they are demoted).

## Context / Business Rules

- **The default landing is an Inbox.** Sections, in order: _My Open Alerts_ · _Awaiting My Approval_ · _Awaiting My Review_ · _Recently Assigned To Me_ · _Upcoming Deadlines (me + my team)_.
- **KPIs are not the landing.** They move to a dedicated `/metrics` or `/overview` route accessible from the nav. Users who prefer KPIs can bookmark it; power users can configure their default landing to `/metrics` via a user preference.
- **Each section is empty-gracefully.** An empty section does not occupy full screen height; it shows a one-line "nothing here" tile.
- **Every row is actionable.** Rows open the originating entity, not a modal. No dead ends.
- **Zero-inbox pattern.** When every section is empty, the page shows a celebratory empty state ("you're all caught up") with a small link to the KPI overview.
- **Personalization is minimal.** Users can hide sections and reorder them; the default ordering is canonical.
- **Performance target.** Above-the-fold paint < 1.5s on the baseline network profile; section queries run in parallel.

## Acceptance Criteria

- [ ] AC1: Logged-in `/` route renders an Inbox composed of the five sections listed above in that default order.
- [ ] AC2: Each section header shows the section name and a live count badge (e.g., "Awaiting My Approval · 7").
- [ ] AC3: Each section renders up to 10 rows by default, with a "View all" link routing to a filtered list for that section.
- [ ] AC4: Each row is 56px high, shows the entity type chip, the entity title, a one-line summary, a relative timestamp, and a per-row primary action (Open / Approve / Start Review / …).
- [ ] AC5: Clicking a row opens the entity's own page at the section-appropriate deep link (Approval section for "Awaiting My Approval", Review Gates for "Awaiting My Review", etc.).
- [ ] AC6: All five section queries run in parallel; slow sections render their own skeletons without blocking the others.
- [ ] AC7: If any section query errors, that section shows an inline error chip — the other sections are unaffected.
- [ ] AC8: A user preferences panel lets users hide sections and reorder them; preferences persist per user; resetting restores defaults.
- [ ] AC9: Users may set their default landing to `/metrics` via a single user-preference toggle; `/` continues to exist for direct bookmarks.
- [ ] AC10: Empty state ("you're all caught up") renders when every section has zero items.
- [ ] AC11: The old KPI-first home is moved under `/metrics` with a redirect from any old bookmark (301-style client redirect).
- [ ] AC12: Unit tests cover the five section queries and the preferences toggle with ≥ 85% coverage.

## UI Behavior

- Shell layout is unchanged — nav + content. The content area is the Inbox.
- Sections are cards with a subtle border; not background-filled.
- Row typography: entity title 14px semibold, summary 13px regular, timestamp 12px muted.
- Per-row action button is small, right-aligned.
- Loading: each section renders 3 skeleton rows until data resolves.
- Mobile (< 768px): sections stack vertically; rows compress to two-line layout.
- Accessibility: each section is a `<section>` landmark with a visible heading; keyboard nav moves between rows; per-row action is tab-reachable.
- Theme: neutral; no celebratory colours except in the all-caught-up empty state.

## Out of Scope

- Email digest of inbox contents — deferred.
- Cross-user inbox sharing ("see what my teammate has open") — deferred.
- Inbox search (jump to a specific entity) — covered by global search, out of scope here.
- KPI widgets inside the Inbox — by design, KPIs live on `/metrics`.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `InboxSection` contract, the five canonical queries, the preference storage scheme, and the `<InboxSection />` component interface.

## Dev Checklist (NOT for QA)

1. Define `InboxSectionConfig` in template types (section id, label, order, hidden-by-default).
2. Implement the five canonical queries as hooks: `useMyAlerts`, `useAwaitingMyApproval`, `useAwaitingMyReview`, `useRecentlyAssignedToMe`, `useUpcomingDeadlines`.
3. Build `<Inbox />` composite and `<InboxSection />` primitive. Parallel fetch via TanStack `useQueries`.
4. Migrate the previous KPI dashboard to `/metrics`; add a client-side redirect logger for `/` → `/metrics` when the user's preference has been flipped.
5. Build the preferences panel UI and wire to the existing user-prefs storage.
6. Write empty, error, and loading states for every section; publish Storybook stories.
7. Add unit tests for each section hook and the preferences toggle.

## AutoGent Test Prompts

1. **AC1-AC2 — Landing is the Inbox.** "Log in as any user. Verify the URL is `/` and the page title is 'Inbox'. Verify five section headers are visible in the canonical order, each with a count badge."
2. **AC3-AC5 — Row click-through.** "On the 'Awaiting My Approval' section, click the first row. Verify navigation to `/{entity-type}/{entity-id}` with the page scrolled to the Approval section."
3. **AC6-AC7 — Parallel, resilient fetch.** "Simulate a 500 on the `useAwaitingMyReview` query. Reload `/`. Verify the other four sections render normally and the errored section shows an inline error chip."
4. **AC8 — Preferences persist.** "In user preferences, hide the 'Upcoming Deadlines' section and move 'My Open Alerts' to the bottom. Reload. Verify the Inbox respects the new layout. Click 'Reset to defaults'; verify canonical order returns."
5. **AC9 — Metrics bookmark.** "Navigate to `/metrics` directly. Verify the old KPI dashboard renders. Flip the preference to 'Land on /metrics by default'. Navigate to `/`. Verify the user lands on `/metrics`."
6. **AC10 — Zero inbox.** "Seed fixtures so every section is empty. Reload `/`. Verify the 'you're all caught up' empty state renders with a link to `/metrics`."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] E2E test for each section rendering + per-row action
- [ ] Storybook stories for Inbox (empty, mixed, all-error) and each InboxSection state
- [ ] WCAG 2.1 AA — sections are landmarks, headings have hierarchy, per-row action keyboard-accessible
- [ ] Performance budget met — above-the-fold paint < 1.5s on baseline network
- [ ] Documentation updated — template adoption guide explains how to register custom inbox sections
- [ ] TypeScript strict — no `any`

# Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline

## Vision

Surface the complete lifecycle of every device as a **single, persona-aware story** — from registration through firmware deployments, service orders, ownership changes, status transitions, and decommission. This epic adds **no new systems of record**. Instead, it composes existing telemetry (audit log, CDC events, firmware assignments, digital twin snapshots, service orders) into a unified timeline that Technicians, Admins, Sales, and Customers can each consume through their own lens.

## Business Context

The IMS Gen2 core already captures the data — every entity change writes an AUDIT# record (Epic 8), firmware history is first-class (Epic 4 + Story 20.6), and Digital Twin state snapshots are retained for 180 days (Epic 15). What's missing is the **presentation layer** that turns this raw data into a story a user can trust, export, and act on.

For a template that aspires to be enterprise-grade, a unified "device passport" is table stakes for:

- **Compliance** — chain-of-custody for NIST SR-11 (supply-chain integrity) and CM-8 (asset inventory)
- **Warranty & Insurance** — provable ownership and operational history
- **Support & Field Service** — technicians need one screen, not five tabs
- **Sales** — demo-able narrative ("bought → deployed → updated N times → zero incidents → $X saved")
- **Forensics** — reconstruct device state at a past timestamp for incident response

## Architecture Principles

1. **Compose, don't rebuild** — Every story reuses existing data sources (CDCEvent from 20.8, AuditLog from Epic 8, FirmwareAssignment from Story 26.9, Digital Twin snapshots from Epic 15). No new event bus, no new audit table.
2. **Presentation over capture** — This epic adds UI, view-models, and small field additions. It does NOT introduce new write paths for existing entity changes.
3. **Persona-aware by default** — The same underlying event stream is filtered by `rbac.ts` roles, not duplicated per persona.
4. **Read-only read-models** — Any derived view (ownership chain, status history) is a projection over existing audit logs, not a new source of truth.
5. **Exportable** — Every timeline surface supports CSV export (reusing the pattern from `audit-log-tab.tsx`).

## Enterprise Standards (MUST match existing codebase quality)

| Standard                                      | Reference Implementation                                | Applies To                                                                    |
| --------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Factory functions** (`createXxxProvider()`) | `createMockApiProvider()`, `createAmplifyAuthAdapter()` | Any new provider or view-model factory                                        |
| **JSDoc with @example**                       | `IAuthAdapter` in `auth-adapter.ts`                     | Every new public type and hook                                                |
| **TanStack Query integration**                | Existing query patterns                                 | All timeline/ownership hooks use `useQuery` with proper cache keys            |
| **RBAC enforcement**                          | `canAccess()`, `canPerform()` in `src/lib/rbac.ts`      | Timeline filtering MUST route through existing RBAC, not duplicate role logic |
| **NIST compliance**                           | AU-2/AU-3 audit logging, AC-3 access enforcement        | Export and view actions are audit-logged                                      |
| **Readonly config properties**                | `refreshIntervalMs` in `IAuthAdapter`                   | Any new config constants are `readonly`                                       |
| **Accessibility**                             | Existing story a11y + Storybook addon                   | Timeline is keyboard-navigable, WCAG 2.1 AA                                   |

## Stories

| Story | Title                                         | Phase               | Points | Priority |
| ----- | --------------------------------------------- | ------------------- | ------ | -------- |
| 27.1  | Per-Device Unified Lifecycle Timeline         | 1 — Composition     | 8      | P0       |
| 27.2  | Persona-Aware Timeline Filtering              | 1 — Composition     | 5      | P0       |
| 27.3  | Device Ownership / Custody Chain View         | 2 — Derived Views   | 5      | P1       |
| 27.4  | Firmware Approval Comments & Rollback Reasons | 2 — Field Additions | 3      | P1       |
| 27.5  | Device Status Transition History              | 2 — Derived Views   | 3      | P1       |

## Dependencies

- **Epic 8** — Audit Trail infrastructure (AUDIT# records, Lambda processor) — MUST be live
- **Epic 20 Story 20.6** — Firmware Version History (timeline pattern, detail page convention) — reference implementation
- **Epic 20 Story 20.8** — CDC Event Provider (`ICDCProvider`, `CDCEvent`, `getChangeHistory`) — data source for 21.1
- **Story 26.9** — `FirmwareAssignment` entity — extended in 21.4
- **Epic 15** — Digital Twin state snapshots — referenced (not modified) by 21.1

## Out of Scope (Explicitly Deferred)

- **Device location history** — YAGNI until a customer asks; current lat/lng is sufficient for Epic 9/10 use cases
- **Config snapshots / diff viewer** — Digital Twin already captures state; building a diff UI is polish, not enterprise-critical
- **Event-sourced temporal "state at T"** — audit log + Digital Twin snapshots already answer this; building a dedicated read-model is over-engineering
- **Lifecycle PDF export** — CSV export (reused from audit-log-tab) is sufficient; PDF generation is deferred as marketing polish
- **Record-level revision counters / optimistic locking** — no write-contention problem exists; `_schemaVersion` is sufficient
- **Custom fields on timeline events** — BAs can filter existing fields; custom-field infrastructure is a separate concern

## Delivery Sequence

1. **Sprint 1:** Stories 21.1 + 21.2 — the visible demo win (unified timeline + persona filter)
2. **Sprint 2:** Stories 21.3 + 21.4 + 21.5 — ownership chain, approval/rollback reasons, status transition history

## Success Metrics

- Technician "time to context" on a dispatched device drops from ~5 clicks (across tabs) to 1 click
- Sales demo reconstructs a device's full story without switching screens
- Compliance exports for a single device can be generated in under 30 seconds
- Zero new database tables introduced (composition-only verification)

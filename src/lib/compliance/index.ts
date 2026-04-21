/**
 * Epic 28 — Enterprise Compliance Workflow Patterns
 *
 * Generic, domain-agnostic compliance primitives. This library explicitly
 * does NOT import from any IMS / firmware / device feature folder — every
 * type uses generics so consumers can parameterize for their domain.
 *
 * Public surface exported from this barrel:
 * - Evidence store (Story 28.1): immutable, provider-pluggable, audited
 * - Checklist engine (Story 28.2): N-of-M completeness with waiver kinds
 * - Approval state machine (Story 28.3): 4-state workflow with SoD + audit
 *
 * Upcoming primitives (not yet shipped — see Docs/epics/epic-28/):
 * - 28.4 SLA tracker for conditional approvals
 * - 28.5 Scoped one-time secure distribution
 * - 28.6 Two-phase action confirmation
 * - 28.7 Inverse dependency / blast-radius query
 */

export * from "./types";
export * from "./evidence";
export * from "./checklist";
export * from "./approval";

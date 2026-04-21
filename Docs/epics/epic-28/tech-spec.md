# Epic 28 — Tech Spec: Enterprise Compliance Workflow Patterns

## Architectural Premise

This epic ships a **compliance primitives library** under `src/lib/compliance/`. Every primitive is a **provider interface + at least two adapter implementations + a set of React hooks + reference UI components**. The library is domain-agnostic: types use generic parameters; no file imports IMS domain entities.

The reference implementation wires these primitives into the existing firmware flow so the patterns are exercised end-to-end. That wiring lives in the firmware feature folder, NOT inside `src/lib/compliance/` — the library must remain domain-free.

## File Layout

```
src/lib/compliance/
├── evidence/                          ← Story 28.1
│   ├── evidence-store.interface.ts
│   ├── mock-evidence-store.ts
│   ├── s3-evidence-store.ts           (reference adapter — s3 object lock)
│   ├── evidence-errors.ts             (EvidenceImmutabilityError, etc.)
│   └── evidence-store.test.ts
├── checklist/                         ← Story 28.2
│   ├── checklist-schema.ts            (generic N-of-M checklist type)
│   ├── completeness-engine.ts         (pure evaluator — no I/O)
│   ├── use-checklist.ts               (hook)
│   └── completeness-engine.test.ts
├── approval/                          ← Stories 28.3, 28.4
│   ├── approval-state-machine.ts      (4-state transition table)
│   ├── approval-engine.interface.ts
│   ├── mock-approval-engine.ts
│   ├── dynamodb-approval-engine.ts    (reference adapter)
│   ├── sla-tracker.ts                 (Story 28.4 — deadline alerts)
│   ├── approval-errors.ts
│   ├── use-approval.ts
│   └── approval-state-machine.test.ts
├── distribution/                      ← Stories 28.5, 28.6
│   ├── secure-distribution.interface.ts
│   ├── mock-secure-distribution.ts
│   ├── s3-signed-url-distribution.ts  (one-time MFA-gated signed URL)
│   ├── confirmation-primitive.ts      (Story 28.6 — two-phase init→complete)
│   ├── distribution-errors.ts
│   ├── use-secure-distribution.ts
│   └── secure-distribution.test.ts
├── impact/                            ← Story 28.7
│   ├── dependency-graph.interface.ts
│   ├── mock-dependency-graph.ts
│   ├── dynamodb-dependency-graph.ts   (reference adapter using GSI)
│   ├── use-inverse-dependency.ts
│   └── dependency-graph.test.ts
└── index.ts                           (public re-exports only)

src/app/components/compliance/         ← UI primitives (generic)
├── evidence-viewer.tsx                ← Story 28.1 — read-only viewer with immutability badge
├── checklist-panel.tsx                ← Story 28.2
├── approval-gate-badge.tsx            ← Story 28.3
├── waiver-dialog.tsx                  ← Story 28.4
├── sla-countdown.tsx                  ← Story 28.4
├── secure-download-button.tsx         ← Story 28.5
├── confirmation-dialog.tsx            ← Story 28.6
└── impact-query-table.tsx             ← Story 28.7
```

The reference wiring (firmware-flow integration) lives in existing firmware feature folders:

```
src/app/components/firmware/
├── firmware-intake-bundle.tsx         (uses checklist-panel + evidence-viewer)
├── firmware-review-gate.tsx           (uses approval-gate-badge + waiver-dialog)
├── firmware-distribution-request.tsx  (uses secure-download-button)
└── firmware-impact-query.tsx          (uses impact-query-table)
```

## Generic Types (Domain-Free)

```typescript
// Story 28.1 — Evidence
export interface EvidenceMetadata {
  readonly id: string;
  readonly contentHash: string; // sha-256
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: string; // ISO-8601
  readonly uploadedBy: { userId: string; displayName: string };
  readonly retention: { mode: "compliance" | "governance"; retainUntil: string };
  readonly immutable: true; // type-level guarantee
}

export interface IEvidenceStore {
  put(input: EvidencePutInput): Promise<EvidenceMetadata>;
  get(id: string): Promise<EvidenceMetadata>;
  getSignedReadUrl(id: string, expiresInSeconds: number): Promise<string>;
  list(filter: EvidenceListFilter): Promise<EvidenceMetadata[]>;
  // NO delete, NO update, NO patch — enforced at interface level
}

// Story 28.2 — Checklist
export interface ChecklistSlot<TKey extends string = string> {
  readonly key: TKey;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}

export type SlotState =
  | { kind: "present"; evidenceId: string; filledAt: string; filledBy: string }
  | { kind: "missing" }
  | { kind: "waived-permanent"; reason: string; waivedAt: string; waivedBy: string }
  | { kind: "waived-conditional"; reason: string; dueAt: string; waivedBy: string };

export interface ChecklistState<TKey extends string = string> {
  readonly schemaId: string;
  readonly slots: Record<TKey, SlotState>;
}

export type Completeness =
  | { kind: "complete" }
  | { kind: "conditionally-complete"; pendingWaivers: string[] }
  | { kind: "incomplete"; missing: string[] };

// Story 28.3 + 28.4 — Approval
export type ApprovalState = "pending" | "approved" | "conditionally-approved" | "rejected";

export interface Approval<TSubjectId extends string = string> {
  readonly id: string;
  readonly subjectId: TSubjectId;
  readonly state: ApprovalState;
  readonly reviewer: { userId: string; displayName: string } | null;
  readonly reason: string | null;
  readonly decidedAt: string | null;
  readonly conditions: SlaCondition[]; // Story 28.4
}

export interface SlaCondition {
  readonly id: string;
  readonly description: string;
  readonly dueAt: string;
  readonly status: "pending" | "satisfied" | "breached";
}

// Story 28.5 + 28.6 — Distribution
export interface SecureLinkRequest {
  readonly evidenceId: string;
  readonly recipientUserId: string;
  readonly expiresInSeconds: number;
  readonly requireStepUpMfa: boolean;
}

export interface SecureLink {
  readonly url: string;
  readonly expiresAt: string;
  readonly singleUse: true;
}

// Story 28.6 — Two-phase confirmation
export interface ActionInitiation<TPayload = unknown> {
  readonly id: string;
  readonly kind: string; // caller-defined action type
  readonly initiatedAt: string;
  readonly initiatedBy: string;
  readonly payload: TPayload;
  readonly state: "initiated" | "confirmed" | "abandoned";
}

export interface ActionConfirmation<TProof = unknown> {
  readonly initiationId: string;
  readonly confirmedAt: string;
  readonly confirmedBy: string;
  readonly proof: TProof;
}

// Story 28.7 — Inverse dependency query
export interface Consumer<TMeta = unknown> {
  readonly consumerId: string;
  readonly consumerType: string;
  readonly version: string;
  readonly scope: string[]; // e.g., ["site:abc", "tenant:xyz"]
  readonly meta: TMeta;
}

export interface IDependencyGraph {
  listConsumers<T>(resourceId: string, version: string): Promise<Consumer<T>[]>;
  listVersionsInUse(resourceId: string): Promise<string[]>;
}
```

## State Machine (Story 28.3)

```
           ┌──────────────────────────────────────┐
           │                                       │
  pending ─┼──> approved                           │
           │                                       │
           ├──> conditionally-approved ─> approved │
           │            │                          │
           │            └──> rejected              │
           │                                       │
           └──> rejected ──> pending  (resubmit)   │
```

- `conditionally-approved` is reachable only when at least one `waived-conditional` slot exists on the checklist (Story 28.2)
- Transition to `approved` from `conditionally-approved` requires ALL `SlaCondition.status === "satisfied"`
- Transition audit-logs actor, reason, and prior state (AU-2/AU-3)

## SLA Tracker (Story 28.4)

- A background hook (`useSlaWatch`) runs in-app, recomputing breach states on 60-second intervals and on window focus
- Breach alerts are emitted as in-app notifications; breach audit-logs are written immediately
- A cron-equivalent server task (out of scope for this story — documented in `Docs/integration-contract.md`) ensures alerts fire even when no user is logged in
- The watch hook MUST use visibility-aware backoff (Story 22.8 pattern)

## Provider Selection (Integration Contract)

Each adapter is selected via env var following the Epic 19 pattern:

```
EVIDENCE_STORE_PROVIDER=mock | s3
APPROVAL_ENGINE_PROVIDER=mock | dynamodb
SECURE_DISTRIBUTION_PROVIDER=mock | s3-signed-url
DEPENDENCY_GRAPH_PROVIDER=mock | dynamodb
```

Selection happens in `src/lib/compliance/index.ts` factory resolver; call sites import from the barrel.

## NIST 800-53 Mapping

| Control              | Where Enforced                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| AU-2 / AU-3 (Audit)  | Every state transition in 28.3/28.4, every put/getSignedReadUrl in 28.1, every distribution event in 28.5/28.6 |
| AC-3 (Access)        | Approval/waiver/distribution gated through `canPerform()` in rbac.ts                                           |
| AC-5 (SoD)           | Approval engine rejects `reviewerId === requesterId`                                                           |
| SC-12 (Key Mgmt)     | S3 evidence store uses KMS-encrypted buckets; adapter documents required policy                                |
| SI-10 (Input Valid.) | Zod schemas at every adapter boundary (per api-data-layer-rulebook §3)                                         |
| MP-6 (Media Sanit.)  | WORM storage disallows delete — compliance mode documented                                                     |

## Error Taxonomy

All primitives throw typed errors that extend a base `ComplianceError`:

- `EvidenceImmutabilityError` — attempt to delete/modify immutable evidence
- `ChecklistIncompleteError` — approval requested while checklist incomplete without waiver
- `ApprovalTransitionError` — invalid state machine transition
- `SelfApprovalError` — SoD violation
- `SlaBreachError` — condition due date has passed
- `SecureLinkExpiredError`, `SecureLinkConsumedError` — one-time-link failures
- `MfaStepUpRequiredError` — distribution requires step-up MFA
- `ActionConfirmationMismatchError` — proof fails validator

Errors are surfaced through the existing global error boundary + toast pipeline (Story 22.3).

## Testing Strategy

- Every primitive: ≥ 85% line coverage with both mock and reference adapter exercised
- State machine: exhaustive transition table test — every (from, to) pair in the table is covered (allowed or explicitly rejected)
- SLA tracker: time-mocked tests for `T-3d`, `T-1d`, `T-0`, `T+1d` breach scenarios
- Distribution: test single-use enforcement (second redemption fails), expiry, MFA step-up denial
- Adapter parity tests: a shared test harness runs identical scenarios against every adapter implementation; any deviation fails CI

## Migration / Backward Compatibility

- No existing IMS data is migrated. The reference firmware flow is _additively_ wired to the new primitives; legacy firmware tables remain untouched until a Phase 4 migration story (out of scope for Epic 28).
- Feature flag `FEATURE_COMPLIANCE_LIB=on` gates the reference wiring so the legacy flow remains available during rollout.

## Definition of Done (Epic-Level)

- All 7 stories shipped behind `FEATURE_COMPLIANCE_LIB` flag
- Zero IMS domain imports in `src/lib/compliance/**` — enforced by ESLint `no-restricted-imports`
- Adapter parity test suite passes for every primitive
- Integration contract documented in `Docs/integration-contract.md`
- Auditor walkthrough script added to `Docs/audit/compliance-walkthrough.md`

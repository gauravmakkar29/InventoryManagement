# Story 28.6: Two-Phase Action Confirmation (Chain of Custody)

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 3: PROVENANCE
**Persona:** Field Operator (reference persona: Service Technician) / Compliance Officer (audience)
**Priority:** P2
**Story Points:** 5
**Status:** New

## User Story

As a compliance officer, I want every action that involves an external, real-world step — shipping an asset, deploying a configuration, installing a device, delivering a document — to be modeled as a two-phase workflow (initiate → confirm-with-proof) so that the audit trail records not just that an action was authorized and distributed, but that the action was actually completed and evidenced, closing the chain of custody.

## Preconditions

- Story 28.1 shipped — evidence store is available for storing proof artifacts
- Story 28.5 shipped — distribution primitive is the most common "initiate" caller
- RBAC: `canPerform("confirmation.initiate", resource)`, `canPerform("confirmation.complete", resource)`, `canPerform("confirmation.abandon", resource)`

## Context / Business Rules

- **Two-phase lifecycle states:** `initiated` → (`confirmed` | `abandoned`). No state walk-backs.
- **Initiation is always audit-logged and timestamped with actor + kind + payload.**
- **Confirmation requires proof.** The caller supplies a `proof` object validated by a caller-provided `validator(proof): ValidationResult`. Proof commonly includes: confirmation timestamp, location coordinates (optional), notes, and 1..N `evidenceId` references to uploaded photos/docs (via Story 28.1).
- **Abandonment is a first-class outcome.** An `initiated` action that is never completed is abandoned explicitly (user action) or after a timeout (`abandonAfterMs` per adapter config). Abandonment writes its own audit record with reason.
- **SoD (optional, caller-chosen):** adapter config `requireDistinctConfirmer` (default `false`) throws `SelfConfirmationError` when `initiatedBy === confirmedBy`. Callers that need this invariant enable it.
- **Open-ended timeline.** Initiations do not auto-expire by default; each adapter sets its own timeout via config. Configuration is documented.
- **Domain-free.** `ActionInitiation<TPayload>` is generic; `kind` is a caller-supplied string. The primitive knows nothing about devices, deployments, or installations.

## Acceptance Criteria

- [ ] AC1: `ActionInitiation<TPayload>`, `ActionConfirmation<TProof>`, `ConfirmationOutcome` types defined in `src/lib/compliance/distribution/confirmation-primitive.ts`.
- [ ] AC2: `IConfirmationEngine` interface defined: `initiate(kind, payload, actor)`, `complete(initiationId, proof, actor)`, `abandon(initiationId, reason, actor)`, `loadByKind(kind, filter)`, `loadById(initiationId)`.
- [ ] AC3: `createMockConfirmationEngine()` + `createDynamoDbConfirmationEngine(config)` factories exist with parity tests.
- [ ] AC4: `initiate` enforces `canPerform("confirmation.initiate", subject)`; `complete` enforces `canPerform("confirmation.complete", subject)`; `abandon` enforces `canPerform("confirmation.abandon", subject)`. Failures throw `AccessDeniedError` + audit denial.
- [ ] AC5: `complete` validates the proof against a caller-registered validator (`registerValidator(kind, validator)`) — failure throws `ActionConfirmationMismatchError` with the validator's messages.
- [ ] AC6: `complete` verifies initiation exists, is in `initiated` state, and has not been abandoned; otherwise throws `InvalidTransitionError`.
- [ ] AC7: `complete` respects `requireDistinctConfirmer` config — when `true` and `initiatedBy === confirmedBy`, throws `SelfConfirmationError`.
- [ ] AC8: Background `abandonStaleInitiations(kind)` job or hook transitions `initiated` records older than `abandonAfterMs` to `abandoned` with reason `"auto-abandoned: exceeded timeout"`. In-app, this is exposed via `useAbandonStaleInitiations()` hook — caller decides when to run.
- [ ] AC9: `useConfirmation(initiationId)` hook returns `{ initiation, complete, abandon }` — TanStack Query read + mutations.
- [ ] AC10: `<ConfirmationDialog kind payload validator onConfirmed>` component renders a form driven by a caller-provided schema; uploads any attached evidence via `IEvidenceStore.put()`; calls `complete` with the proof payload; shows success/error states.
- [ ] AC11: `<ProvenanceTimeline subjectId>` component renders the complete chain — approval decision → distribution mint → redemption → confirmation (or abandonment) — pulling from existing audit records. Each entry includes actor, timestamp, outcome.
- [ ] AC12: Every state change (initiate, complete, abandon, auto-abandon, denials, validator failure) writes an AUDIT# record with full context.
- [ ] AC13: Reference wiring: firmware **deployment confirmation** — when a service technician redeems a distribution link, a confirmation is initiated automatically; after on-site install, the tech completes it with proof (photos, timestamp, notes) via `<ConfirmationDialog>`. The firmware domain registers its proof validator externally; the compliance library knows nothing about firmware.
- [ ] AC14: Reference proof validator (in firmware feature folder, NOT in `src/lib/compliance/**`) validates: at least 1 photo evidence, notes 10-2000 chars, timestamp within 30 days.
- [ ] AC15: Unit tests ≥ 85% coverage; specifically cover: all valid transitions, all blocked transitions, validator success/failure, SoD config on/off, auto-abandon timer.

## UI Behavior

- Confirmation dialog: title "Confirm [kind]", payload summary (read-only), proof form driven by validator schema, evidence upload button (multi-select, preview thumbnails)
- Submit button disabled until validator passes locally (client-side); server re-validates
- Abandon flow: smaller text link "Unable to complete — abandon action" → confirmation dialog with reason textarea
- Provenance timeline: vertical stepper with color-coded nodes (green=confirmed, amber=in-flight, gray=abandoned, red=denied)
- Empty state: "No actions initiated"
- Error states: validator failure lists per-field messages; transition failures show a red banner with the typed error

## Out of Scope

- Offline / intermittent-connectivity proof capture (service techs in bad-signal areas) — deferred to a domain-specific mobile story
- Proof cryptographic signing (non-repudiation) — deferred; proof is trusted on the platform
- Multi-step confirmation ("installation began" → "installation complete") — this primitive is single-step; callers compose multi-phase flows
- Rewriting past confirmations / corrections — confirmations are immutable; corrections require a new initiation

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"File Layout → distribution/", §"Generic Types → Story 28.6", §"Error Taxonomy".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AC-3 (all three ops gated), AU-2/3 (every transition + denial audited), SI-10 (proof validator enforces schema), optional AC-5 (SoD when enabled)
- **`architecture-rulebook.md`** — validator registry pattern keeps proof schema outside the library; domain concerns stay in feature folders
- **`api-data-layer-rulebook.md`** — server-authoritative; no optimistic updates; typed errors
- **`code-quality-rulebook.md`** — ≥ 85% coverage, no `any`, file-size limits

## Dev Checklist (NOT for QA)

1. Define types + errors in `confirmation-primitive.ts`
2. `IConfirmationEngine` interface with clear JSDoc
3. Implement `createMockConfirmationEngine()` with in-memory state + validator registry
4. Implement `createDynamoDbConfirmationEngine()` reference adapter with TTL-based auto-abandon
5. RBAC + SoD config + audit on every branch
6. `useConfirmation` hook + `<ConfirmationDialog>` + `<ProvenanceTimeline>`
7. Storybook stories for dialog (happy/validator-fail/evidence-upload) + timeline (complete chain)
8. Reference wiring — firmware deployment confirmation; register firmware-specific validator in `src/lib/firmware/firmware-deployment-validator.ts`
9. `useAbandonStaleInitiations` hook — documented as caller-driven; reference wiring runs it on admin page load
10. Parity tests; validator-registry test; timeout test

## AutoGent Test Prompts

1. **AC5 — Validator:** "Initiate a firmware deploy confirmation. Complete with no photos. Verify `ActionConfirmationMismatchError` with message 'at least 1 photo required'. Complete with 1 photo + notes. Verify success."
2. **AC6 — Invalid transition:** "Complete an already-completed initiation. Verify `InvalidTransitionError`. Complete an abandoned initiation. Verify same."
3. **AC7 — SoD:** "With `requireDistinctConfirmer=true`, alice initiates and alice attempts complete. Verify `SelfConfirmationError`."
4. **AC8 — Auto-abandon:** "Initiate. Mock clock forward past `abandonAfterMs`. Call `abandonStaleInitiations(kind)`. Verify the initiation is `abandoned` with reason 'auto-abandoned: exceeded timeout'."
5. **AC10 — Dialog:** "Open `<ConfirmationDialog>`. Upload 2 photos. Fill notes 50 chars. Submit. Verify `complete` called with proof containing both evidenceIds."
6. **AC11 — Timeline:** "For a subject that went approval → mint → redeem → complete, render `<ProvenanceTimeline>`. Verify 4 chronological nodes with matching colors."
7. **AC12 — Audit:** "After initiate + complete, verify 2 AUDIT# records; after abandon, 2 records (initiate + abandon)."

## Definition of Done

- [ ] Code reviewed + approved
- [ ] Unit tests ≥ 85% coverage; all transitions + validator paths covered
- [ ] Adapter parity tests green
- [ ] Storybook stories published
- [ ] Reference firmware deployment confirmation wired end-to-end behind flag
- [ ] Validator registry pattern verified — no firmware types leaked into `src/lib/compliance/**`
- [ ] NIST audit integration: initiate, complete, abandon, all denials logged
- [ ] Provenance timeline demonstrable end-to-end (approval → mint → redeem → confirm)
- [ ] TypeScript strict, no `any`

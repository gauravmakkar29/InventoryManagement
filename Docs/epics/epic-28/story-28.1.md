# Story 28.1: Immutable Evidence Store — Provider Interface & Adapters

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 1: FOUNDATION
**Persona:** Compliance Officer (reference persona) / Template Consumer (audience)
**Priority:** P0
**Story Points:** 8
**Status:** New

## User Story

As a compliance officer, I want every piece of evidence submitted to the platform to be stored in a tamper-evident, append-only store where no user — including platform administrators — can modify or delete the underlying bytes, so that the integrity of the audit trail is provable to an external auditor regardless of who later operates the system.

## Preconditions

- Epic 19 Story 19.5 (auth adapter pattern) established — this story extends the same provider-pluggability convention
- `src/lib/rbac.ts` defines user roles and the `canPerform(action, resource)` primitive
- Existing storage provider factory pattern documented in `Docs/integration-contract.md`
- Feature flag `FEATURE_COMPLIANCE_LIB` available in runtime config

## Context / Business Rules

- **Immutability is a library invariant.** The `IEvidenceStore` interface does NOT expose `delete`, `update`, or `patch` methods. The type system, not a runtime check, prevents mutation.
- **Retention modes:** `compliance` (cannot be overridden even by admin — matches S3 Object Lock COMPLIANCE mode); `governance` (admin override possible with audit trail — matches S3 Object Lock GOVERNANCE mode). Adapters document which modes they support.
- **Content-addressed identity.** Every evidence record exposes a SHA-256 content hash. Two uploads of identical bytes produce the same hash, surfaced at the adapter level (deduplication is optional at the adapter level).
- **Domain-free types.** No type in this story references firmware, device, SBOM, etc. `EvidenceMetadata` is generic and carries an optional `tags: Record<string, string>` for caller-specific labeling.
- **Adapter parity.** The mock adapter and the S3 adapter pass identical behavioral tests. A parity harness is shipped as part of this story.
- **Audit-logged operations.** Every `put` and every `getSignedReadUrl` writes an AUDIT# record with actor, evidenceId, contentHash, and timestamp (AU-2/AU-3).

## Acceptance Criteria

- [ ] AC1: `IEvidenceStore` interface is defined in `src/lib/compliance/evidence/evidence-store.interface.ts` with methods: `put(input)`, `get(id)`, `getSignedReadUrl(id, expiresInSeconds)`, `list(filter)`. No `delete`, `update`, or `patch` methods exist.
- [ ] AC2: `EvidenceMetadata` type is defined with fields: `id`, `contentHash`, `mimeType`, `sizeBytes`, `uploadedAt`, `uploadedBy`, `retention` (mode + retainUntil), `tags` (record), `immutable: true`. All fields `readonly`.
- [ ] AC3: `createMockEvidenceStore()` factory is implemented with in-memory storage that honors the interface; attempting to mutate a stored record via any means returns an `EvidenceImmutabilityError`.
- [ ] AC4: `createS3EvidenceStore(config)` factory is implemented using AWS SDK v3 with `ObjectLockLegalHold` and `ObjectLockRetentionMode=COMPLIANCE` on every `PutObject` call. The adapter documents the required IAM policy and bucket configuration in a JSDoc block at the top of the file.
- [ ] AC5: Both adapters compute SHA-256 of the payload client-side before upload and expose it on the returned `EvidenceMetadata.contentHash`.
- [ ] AC6: A `useEvidence(id)` hook (TanStack Query) returns metadata with `staleTime: Infinity` — immutable records never stale.
- [ ] AC7: A `useEvidenceSignedUrl(id, expiresInSeconds)` hook returns a signed read URL; the hook refreshes before expiry (safe margin = 30s).
- [ ] AC8: A generic `<EvidenceViewer evidenceId={...}>` component renders read-only metadata, an inline preview for common mime types (pdf/image/json/text), a download button via signed URL, and an **"Immutable — cannot be modified or deleted"** badge with icon.
- [ ] AC9: `EvidenceImmutabilityError` is thrown whenever any adapter rejects a modification attempt; error is classified and surfaced via the existing global error handler (Story 22.3).
- [ ] AC10: Every `put` and every `getSignedReadUrl` writes an audit-log record with action + actor + evidenceId + contentHash via the existing audit pipeline (Epic 8).
- [ ] AC11: RBAC: `canPerform("evidence.put", resource)` and `canPerform("evidence.read", resource)` are checked before adapter calls; unauthorized callers receive a classified `AccessDeniedError`.
- [ ] AC12: An adapter parity test harness (`src/lib/compliance/evidence/evidence-store.parity.test.ts`) runs the identical 12-scenario test suite against both `createMockEvidenceStore()` and a localstack-backed `createS3EvidenceStore()`.
- [ ] AC13: Reference wiring: firmware artifact upload in `src/app/components/firmware/firmware-intake-bundle.tsx` is refactored to call `useEvidenceStore().put(...)` instead of the legacy firmware-specific upload path. Legacy path remains behind `FEATURE_COMPLIANCE_LIB=off`.
- [ ] AC14: Storybook stories for `EvidenceViewer` cover: pdf preview, image preview, json preview, unsupported mime (fallback), loading, error, unauthorized.
- [ ] AC15: Unit tests cover interface implementations with ≥ 85% line coverage including error paths (immutability violation, unauthorized access, expired signed URL).

## UI Behavior

- **Evidence viewer** — header shows label + mime + size + upload actor + upload timestamp
- **Immutability badge** — amber pill with a lock icon and tooltip "Stored under COMPLIANCE mode retention. No user can modify or delete this record."
- **Download button** — primary action, triggers signed-URL flow; shows spinner while URL is minted; button disabled for 2 seconds after click to prevent double-download
- **Preview area** — inline preview for pdf (iframe), image (img), json (syntax-highlighted), text (pre); unsupported types show "Preview unavailable — use Download" with mime type
- **No edit/delete affordances are rendered anywhere** — enforced at the component level
- **Error states:** unauthorized = locked-state card with "You do not have access to this evidence"; missing = "Evidence not found"; expired URL = auto-retry with new signed URL (user sees brief loading state)

## Out of Scope

- Multi-region replication of evidence (single-region is sufficient for this story)
- Cryptographic signing or notarization of evidence (WORM storage is sufficient)
- Evidence tagging/classification UI (tags are passed programmatically by callers)
- Adapters for Azure Blob Immutable Storage or GCS Retention Policies (deferred; interface supports them)
- Virus scanning (delegated to storage-provider features or a separate pre-signed scan pipeline)
- Bulk upload UI (single-file `put` is the primitive; bulk UX is composed by callers)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"File Layout → evidence/", §"Generic Types → Story 28.1", §"NIST 800-53 Mapping", §"Error Taxonomy".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AU-2/AU-3 (every put + signed URL audited), AC-3 (canPerform gating), SC-12 (KMS for S3 adapter), SI-10 (Zod validation on adapter boundaries), MP-6 (WORM sanitization constraint)
- **`architecture-rulebook.md`** — provider interface + factory pattern, `src/lib/compliance/` placement, no UI→adapter direct imports (hooks only)
- **`api-data-layer-rulebook.md`** — TanStack Query with stable cache key, `staleTime: Infinity` for immutable records, typed errors
- **`code-quality-rulebook.md`** — no `any`, ≥ 85% coverage, file-size limits on adapters

## Dev Checklist (NOT for QA)

1. Create `src/lib/compliance/evidence/` folder
2. Define interface, types, errors in dedicated files
3. Implement `createMockEvidenceStore()` with immutable Map + throws on any mutation
4. Implement `createS3EvidenceStore()` with `ObjectLockRetentionMode=COMPLIANCE` + KMS encryption
5. Add `src/lib/compliance/evidence/index.ts` barrel
6. Create `useEvidence` and `useEvidenceSignedUrl` hooks
7. Create `<EvidenceViewer>` component + Storybook stories
8. Add adapter factory resolver in `src/lib/compliance/index.ts` keyed on `EVIDENCE_STORE_PROVIDER`
9. Wire firmware intake component to new primitive behind `FEATURE_COMPLIANCE_LIB`
10. Add ESLint `no-restricted-imports` rule: `src/lib/compliance/**` cannot import from `src/lib/firmware/**`, `src/lib/device/**`, etc.
11. Write parity test harness — shared scenarios run against every adapter
12. Write unit tests for mock adapter, error paths, and hook behavior
13. Update `Docs/integration-contract.md` with `EVIDENCE_STORE_PROVIDER` env var + IAM policy for S3 adapter

## AutoGent Test Prompts

1. **AC1 — Interface surface:** "Attempt to call `evidenceStore.delete('some-id')` — verify this is a TypeScript compile error. Attempt to call `evidenceStore.update(...)` — verify compile error."
2. **AC3-AC4 — Put and retrieve:** "Using the mock adapter, call `put()` with a test PDF. Verify returned metadata has a non-empty `contentHash`, `immutable === true`, and `retention.mode === 'compliance'`. Call `get()` with the returned id. Verify identical metadata is returned."
3. **AC5 — Content hash:** "Upload the same payload twice. Verify both returned records have the same `contentHash`."
4. **AC8 — Viewer rendering:** "Render `<EvidenceViewer evidenceId='test-pdf'>` in Storybook. Verify the immutability badge is visible. Verify the download button is present. Verify no edit or delete buttons exist."
5. **AC9 — Immutability error:** "Attempt (via a debug harness) to mutate a stored record. Verify `EvidenceImmutabilityError` is thrown and logged to the audit pipeline."
6. **AC10 — Audit logging:** "Call `put()` as user Alice. Inspect the audit log. Verify an AUDIT# record exists with `action: 'evidence.put'`, `actor: 'alice'`, `evidenceId`, and `contentHash` fields."
7. **AC11 — RBAC:** "As a user without `evidence.put` permission, attempt to call `put()`. Verify `AccessDeniedError` is thrown. Verify no audit record is created for the attempt except the denial event itself."
8. **AC13 — Firmware reference wiring:** "With `FEATURE_COMPLIANCE_LIB=on`, upload a firmware artifact via the intake bundle UI. Verify the new `useEvidenceStore().put()` path is exercised. Turn the flag off; verify the legacy path is used."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing with ≥ 85% coverage on new code
- [ ] Adapter parity tests passing for mock + localstack S3
- [ ] Storybook stories published for `EvidenceViewer`
- [ ] `EVIDENCE_STORE_PROVIDER` env var documented in integration contract
- [ ] ESLint `no-restricted-imports` rule in place and green
- [ ] WCAG 2.1 AA — viewer keyboard-navigable, badge announced to screen readers
- [ ] TypeScript strict — no `any` types
- [ ] NIST mapping section of tech-spec verified (AU-2/3, AC-3, SC-12, SI-10, MP-6)
- [ ] Audit-log integration test — put and getSignedReadUrl write AUDIT# records

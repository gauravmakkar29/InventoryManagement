# Story 19.9: Document Immutability on Upload

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Administrator (sets policy) · Auditor (depends on immutability for evidence) · Operator (uploads documents)
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** Any `/{entity-type}/{entity-id}` that accepts document uploads.

## User Story

As an **Auditor**, I need every document uploaded to the platform to be **immutable after upload** — no edits, no silent replacements, no deletions — so that when I later audit an entity's history I can trust that what's in the store is what was uploaded.

## Preconditions

- The template exposes a generic document-upload primitive tied to entity slots.
- The storage backend supports write-once semantics (or the template enforces it in software).
- An audit sink exists.

## Context / Business Rules

- **On-upload lock.** When a document lands in the store, it is timestamped, checksummed, and marked `locked`. All subsequent reads return the same bytes or fail.
- **No edit.** There is no "edit" affordance on a locked document. UI does not offer it; API rejects write attempts.
- **No delete (soft or hard).** A locked document is retained for its configured retention window; a superseding document does not delete the old one — it supersedes.
- **Supersede, don't replace.** When a corrected version is needed, the operator uploads a new document to the same slot; the slot now points to the newer document, but the older document remains retrievable via the slot's history.
- **Version history per slot.** Each slot maintains the full chain of uploads with their metadata.
- **Integrity verification.** On read, the stored checksum is verified against the fetched bytes; a mismatch surfaces as a prominent integrity warning and is audit-logged.
- **Retention is policy-configured.** Documents retain per the admin-configured retention window for their category; expiry after retention is a separate, auditable operation that anonymises/removes content while keeping a tombstone record.
- **Legal hold.** An admin can place a document on legal hold; held documents are exempt from retention expiry.

## Acceptance Criteria

- [ ] AC1: Any document-upload path in the template writes: `content`, `checksum`, `uploaded_by`, `uploaded_at`, `content_type`, `size`, and `locked=true` on successful persistence.
- [ ] AC2: The document-read path verifies checksum against bytes on every fetch; a mismatch returns an integrity error and logs an audit event.
- [ ] AC3: No UI on any entity page exposes an "Edit document" action — editing a slot means uploading a new document (supersede).
- [ ] AC4: The document API rejects PATCH / PUT / DELETE on any `locked` record with 409 Conflict. Audit emits an attempted-mutation event.
- [ ] AC5: Each slot exposes a **Version history** action listing all prior documents (newest first) with uploader, timestamp, and size; each is individually viewable and downloadable.
- [ ] AC6: Uploading to a slot that already has a document creates a new version. The prior document is retained; the new document becomes "current" for the slot.
- [ ] AC7: Retention is attached to the document's category (from Story 19.8's matrix where applicable, or a retention policy table). When retention expires, the document is replaced by a `tombstone` record carrying metadata but no content, and this is audited.
- [ ] AC8: A document on **legal hold** is flagged; retention policies skip it until the hold is released; holding and releasing are audited.
- [ ] AC9: Bulk download of all documents for an entity produces a ZIP with a manifest JSON including every document's checksum, uploader, and timestamp.
- [ ] AC10: Unit tests cover: lock-on-upload, read-checksum verification, supersede-not-replace, retention expiry → tombstone, legal-hold exemption, and mutation-attempt rejection with ≥ 85% coverage.
- [ ] AC11: An integration test uploads a document, attempts to overwrite its bytes in storage (simulated), and verifies the read layer surfaces the integrity error.

## UI Behavior

- Upload UI shows a "locks on upload — cannot edit" tooltip; subtle lock icon appears next to a document in a slot.
- Version history opens in a side sheet; each entry has: download, view, uploader hover-card.
- Integrity errors render a red banner above the document preview; "Report this" button opens a prefilled support form.
- Legal-hold badge is distinct (shield icon + amber) next to the slot title.
- Accessibility: lock / legal-hold badges are announced; version history is keyboard-navigable.

## Out of Scope

- Cryptographic signing of documents (trust the store rather than sign). Signing can be layered on in a later story.
- End-user encryption-at-rest configuration (platform-level encryption assumed).
- Document content-redaction tooling — defer.
- Integration with specific regulatory platforms — defer.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `Document` entity model with `locked`, `checksum`, `supersededBy`, `tombstone`, `legalHold`; the upload and read layer algorithms; the retention sweeper job.

## Dev Checklist (NOT for QA)

1. Add `Document` entity + `DocumentState` enum (locked, tombstoned, legalHold).
2. Wire upload handler to compute checksum, persist with `locked=true`.
3. Wire read handler to verify checksum; on mismatch, log audit + return integrity error.
4. Reject mutation attempts (PATCH/PUT/DELETE) on locked records.
5. Slot data model tracks `currentDocumentId` and a list of prior document ids (version history).
6. Retention sweeper job transitions expired documents to tombstone — keeps metadata, removes content — with audit.
7. Legal-hold API (set / release) with audit.
8. Bulk download endpoint emits ZIP + manifest JSON.
9. Publish Storybook stories for slot w/ document, slot w/ history, integrity-error banner, legal-hold badge.

## AutoGent Test Prompts

1. **AC1-AC4 — Upload, lock, reject mutation.** "Upload a PDF to a slot on a fixture entity. Verify the slot shows the document with a lock icon. Call the API directly with DELETE on the document endpoint. Verify 409 Conflict. Verify an audit event records the attempted mutation."
2. **AC5-AC6 — Supersede, not replace.** "Upload a newer version of the document. Verify the slot shows the newest version. Open Version history. Verify two entries exist (newest and previous); the previous is downloadable."
3. **AC7 — Retention tombstone.** "Advance simulated clock past the retention window. Run the retention sweeper. Verify the document record remains with `state=tombstoned`, metadata preserved, content unavailable, and a tombstone audit event exists."
4. **AC8 — Legal hold exempts from retention.** "Place a document on legal hold. Advance clock past retention. Run sweeper. Verify the document is unchanged. Release hold. Run sweeper. Verify tombstone occurs."
5. **AC2 + AC11 — Integrity mismatch.** "Inject a checksum mismatch (simulated storage corruption). Read the document. Verify an integrity error is returned and an integrity audit event is emitted."
6. **AC9 — Bulk download manifest.** "Trigger bulk download for an entity with 3 documents. Verify the ZIP contains all 3 documents plus `manifest.json` with correct checksums and timestamps."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] Integration test for upload → mutation-attempt rejection
- [ ] Storybook stories for document slot, version history, legal-hold, integrity-error
- [ ] WCAG 2.1 AA — lock / legal-hold badges accessibly labelled
- [ ] Retention sweeper idempotent (re-run safely)
- [ ] Bulk-download manifest schema documented
- [ ] Audit on every write & attempted mutation
- [ ] TypeScript strict — no `any`

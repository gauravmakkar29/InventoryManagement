/**
 * Immutable Evidence Store — provider interface (Story 28.1).
 *
 * The interface is the library's guarantee that stored evidence cannot be
 * mutated, deleted, or overwritten. It deliberately exposes NO `delete`,
 * `update`, or `patch` methods — immutability is enforced at the type level.
 *
 * Adapters back the interface with concrete storage (in-memory mock, AWS S3
 * with Object Lock COMPLIANCE mode, Azure Immutable Blob, GCS Bucket Lock).
 * Every adapter MUST:
 * 1. Compute SHA-256 of payload bytes client-side and expose as `contentHash`
 * 2. Honor the requested retention mode at the storage-provider level
 * 3. Invoke `logAudit` on every `put` and every `getSignedReadUrl`
 * 4. Throw `AccessDeniedError` when RBAC (`canPerformAction`) fails
 *
 * NIST controls: AU-2 / AU-3 (audit), AC-3 (access), SC-12 (key mgmt),
 * SI-10 (adapter input validation), MP-6 (media sanitization forbidden).
 */

import type { ComplianceActor } from "../types";

export type EvidenceRetentionMode = "compliance" | "governance";

/**
 * Metadata for a stored evidence record. All fields `readonly` — records are
 * immutable once written. `immutable: true` is a type-level sentinel.
 */
export interface EvidenceMetadata {
  readonly id: string;
  readonly contentHash: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: string;
  readonly uploadedBy: { readonly userId: string; readonly displayName: string };
  readonly retention: {
    readonly mode: EvidenceRetentionMode;
    readonly retainUntil: string;
  };
  readonly tags: Readonly<Record<string, string>>;
  readonly immutable: true;
}

export interface EvidencePutInput {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  readonly retentionMode: EvidenceRetentionMode;
  readonly retainUntil: string;
  readonly tags?: Readonly<Record<string, string>>;
  readonly actor: ComplianceActor;
}

export interface EvidenceListFilter {
  readonly tags?: Readonly<Record<string, string>>;
  readonly uploadedBy?: string;
  readonly uploadedAfter?: string;
  readonly uploadedBefore?: string;
  readonly limit?: number;
}

/**
 * Provider interface for immutable evidence storage.
 *
 * @example
 * const store = createMockEvidenceStore();
 * const meta = await store.put({
 *   bytes: pdfBytes,
 *   mimeType: "application/pdf",
 *   retentionMode: "compliance",
 *   retainUntil: "2030-01-01T00:00:00Z",
 *   tags: { subject: "firmware-1.2.3" },
 *   actor: { userId: "alice", displayName: "Alice" },
 * });
 * const url = await store.getSignedReadUrl(meta.id, 300, { actor: ... });
 */
export interface IEvidenceStore {
  put(input: EvidencePutInput): Promise<EvidenceMetadata>;
  get(id: string, options: { actor: ComplianceActor }): Promise<EvidenceMetadata>;
  getSignedReadUrl(
    id: string,
    expiresInSeconds: number,
    options: { actor: ComplianceActor },
  ): Promise<string>;
  list(
    filter: EvidenceListFilter,
    options: { actor: ComplianceActor },
  ): Promise<EvidenceMetadata[]>;
  // Intentionally NO delete / update / patch — immutability is the contract.
}

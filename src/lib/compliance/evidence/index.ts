/**
 * Barrel for the evidence-store primitive (Story 28.1).
 *
 * Callers should import from `@/lib/compliance` (library barrel) rather
 * than reaching into submodules. This file is the one place inside the
 * submodule where every public symbol is re-exported.
 */

export type {
  EvidenceListFilter,
  EvidenceMetadata,
  EvidencePutInput,
  EvidenceRetentionMode,
  IEvidenceStore,
} from "./evidence-store.interface";
export {
  EvidenceAdapterConfigError,
  EvidenceImmutabilityError,
  EvidenceNotFoundError,
} from "./evidence-errors";
export { createMockEvidenceStore } from "./mock-evidence-store";
export type { MockEvidenceStoreOptions } from "./mock-evidence-store";
export { createS3EvidenceStore } from "./s3-evidence-store";
export type { IS3Driver, IS3HeadResult, S3EvidenceStoreConfig } from "./s3-evidence-store";
export {
  EvidenceStoreProvider,
  useEvidence,
  useEvidenceSignedUrl,
  useUploadEvidence,
} from "./use-evidence";
export type { EvidenceStoreProviderProps, UseEvidenceSignedUrlResult } from "./use-evidence";
export { sha256Hex } from "./evidence-hash";

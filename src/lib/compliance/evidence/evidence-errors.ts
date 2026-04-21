/**
 * Typed errors for the evidence store primitive (Story 28.1).
 *
 * Every adapter failure path throws a specific subclass so the global
 * error boundary and toast pipeline can classify messages and the audit
 * log can record `outcome: "denied"` / `"error"` with a machine-readable
 * reason. NIST AU-3 (Content of Audit Records) requires this specificity.
 */

import { ComplianceError } from "../types";

/**
 * Thrown when any caller attempts to mutate, delete, or overwrite stored
 * evidence. The interface does not expose these operations; this error is
 * reserved for adapter-internal invariant violations and for test harnesses
 * that probe the immutability contract.
 */
export class EvidenceImmutabilityError extends ComplianceError {
  public readonly kind = "compliance.evidence.immutability";

  public constructor(evidenceId: string, attemptedOp: string) {
    super(
      `Evidence ${evidenceId} is immutable — operation "${attemptedOp}" is not permitted (NIST MP-6).`,
    );
  }
}

/** Thrown when `get` / `getSignedReadUrl` is called for a non-existent record. */
export class EvidenceNotFoundError extends ComplianceError {
  public readonly kind = "compliance.evidence.not-found";

  public constructor(evidenceId: string) {
    super(`Evidence ${evidenceId} not found.`);
  }
}

/** Thrown when adapter configuration is invalid (missing bucket, KMS key, etc.). */
export class EvidenceAdapterConfigError extends ComplianceError {
  public readonly kind = "compliance.evidence.adapter-config";

  public constructor(message: string) {
    super(`Evidence adapter misconfigured: ${message}`);
  }
}

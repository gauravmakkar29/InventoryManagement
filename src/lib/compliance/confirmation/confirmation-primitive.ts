/**
 * Two-phase action confirmation primitive (Story 28.6).
 *
 * Models actions that require a real-world side-effect — shipping,
 * installing, deploying, delivering — as `initiated → (confirmed |
 * abandoned)` transitions. The system-of-record captures:
 *
 * 1. Who initiated the action, when, with what payload
 * 2. Who confirmed it, when, with what proof
 * 3. Or who/when/why it was abandoned
 *
 * This closes the chain-of-custody gap where distribution says "shipped"
 * but there is no corresponding "delivered" / "installed" record.
 *
 * NIST controls: AC-3 (all three ops gated via `canPerformAction`), AU-2/3
 * (every transition audited), optional AC-5 (SoD via
 * `requireDistinctConfirmer`), SI-10 (proof schemas validated).
 */

import type { ComplianceActor } from "../types";

export type ConfirmationState = "initiated" | "confirmed" | "abandoned";

export interface ActionInitiation<TPayload = unknown> {
  readonly id: string;
  readonly kind: string;
  readonly payload: TPayload;
  readonly initiatedAt: string;
  readonly initiatedBy: ComplianceActor;
  readonly state: ConfirmationState;
  readonly confirmation?: {
    readonly confirmedAt: string;
    readonly confirmedBy: ComplianceActor;
    readonly proof: unknown;
  };
  readonly abandonment?: {
    readonly abandonedAt: string;
    readonly abandonedBy: ComplianceActor;
    readonly reason: string;
    readonly auto: boolean;
  };
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly messages: readonly string[];
}

/**
 * A validator is a pure function: given a proof payload, return an
 * ok/messages result. Validators are registered by caller-supplied `kind`
 * strings so the compliance library remains domain-agnostic.
 */
export type ProofValidator<TProof = unknown> = (proof: TProof) => ValidationResult;

export interface ValidatorRegistry {
  register<TProof>(kind: string, validator: ProofValidator<TProof>): void;
  get<TProof>(kind: string): ProofValidator<TProof> | null;
}

export function createValidatorRegistry(): ValidatorRegistry {
  const map = new Map<string, ProofValidator<unknown>>();
  return {
    register(kind, validator) {
      map.set(kind, validator as ProofValidator<unknown>);
    },
    get(kind) {
      return (map.get(kind) ?? null) as ProofValidator | null;
    },
  };
}

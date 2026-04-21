/** Typed errors for the two-phase confirmation primitive (Story 28.6). */

import { ComplianceError } from "../types";

export class ActionInitiationNotFoundError extends ComplianceError {
  public readonly kind = "compliance.confirmation.not-found";
  public constructor(id: string) {
    super(`Action initiation ${id} not found.`);
  }
}

export class InvalidConfirmationTransitionError extends ComplianceError {
  public readonly kind = "compliance.confirmation.invalid-transition";
  public constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid confirmation transition: ${from} → ${to}`);
  }
}

export class ActionConfirmationMismatchError extends ComplianceError {
  public readonly kind = "compliance.confirmation.validator-mismatch";
  public constructor(public readonly messages: readonly string[]) {
    super(`Proof validation failed: ${messages.join("; ")}`);
  }
}

export class SelfConfirmationError extends ComplianceError {
  public readonly kind = "compliance.confirmation.self-confirm";
  public constructor(actorId: string) {
    super(
      `NIST AC-5 (Separation of Duties): actor ${actorId} cannot confirm an action they initiated when requireDistinctConfirmer=true.`,
    );
  }
}

export class UnknownValidatorError extends ComplianceError {
  public readonly kind = "compliance.confirmation.unknown-validator";
  public constructor(kind: string) {
    super(`No validator registered for action kind "${kind}".`);
  }
}

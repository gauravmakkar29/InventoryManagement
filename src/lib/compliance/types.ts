/**
 * Shared types for the compliance primitives library (Epic 28).
 *
 * Types in this file are strictly domain-agnostic. No IMS / firmware / device
 * references are permitted here. Consumers parameterize generics with their
 * own identifiers and metadata shapes.
 */

/**
 * The principal performing a compliance action. Adapters and primitives never
 * reach into an auth context directly — the caller provides the actor so the
 * library remains testable and framework-neutral.
 */
export interface ComplianceActor {
  readonly userId: string;
  readonly displayName: string;
}

/**
 * Base class for all compliance primitive errors. Subclasses are defined in
 * each primitive's `*-errors.ts` file so they can be caught individually.
 *
 * All compliance errors are "classified" — they carry a `kind` string so the
 * global error boundary and toast pipeline can surface appropriate messages.
 */
export abstract class ComplianceError extends Error {
  public abstract readonly kind: string;

  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Access-denied — RBAC failure. Thrown by every primitive when canPerform fails. */
export class AccessDeniedError extends ComplianceError {
  public readonly kind = "compliance.access-denied";

  public constructor(
    public readonly action: string,
    public readonly actorId: string,
    message?: string,
  ) {
    super(message ?? `Actor ${actorId} is not permitted to ${action}`);
  }
}

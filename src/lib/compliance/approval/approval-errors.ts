/**
 * Typed errors for the approval primitive (Story 28.3).
 */

import { ComplianceError } from "../types";

export class SelfApprovalError extends ComplianceError {
  public readonly kind = "compliance.approval.self-approval";

  public constructor(actorId: string) {
    super(
      `NIST AC-5 (Separation of Duties): actor ${actorId} cannot decide an approval they submitted.`,
    );
  }
}

export class ChecklistIncompleteForApprovalError extends ComplianceError {
  public readonly kind = "compliance.approval.checklist-incomplete";

  public constructor(subjectId: string) {
    super(`Subject ${subjectId} cannot be approved — checklist is incomplete.`);
  }
}

export class NoConditionalWaiverError extends ComplianceError {
  public readonly kind = "compliance.approval.no-conditional-waiver";

  public constructor(subjectId: string) {
    super(
      `Subject ${subjectId} cannot be conditionally-approved — no conditional waivers exist on the checklist.`,
    );
  }
}

export class ApprovalNotFoundError extends ComplianceError {
  public readonly kind = "compliance.approval.not-found";

  public constructor(id: string) {
    super(`Approval ${id} not found.`);
  }
}

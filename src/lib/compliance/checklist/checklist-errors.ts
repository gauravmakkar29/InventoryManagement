/**
 * Typed errors for the checklist primitive (Story 28.2).
 */

import { ComplianceError } from "../types";

export class ChecklistSchemaNotFoundError extends ComplianceError {
  public readonly kind = "compliance.checklist.schema-not-found";

  public constructor(schemaId: string) {
    super(`Checklist schema "${schemaId}" not found.`);
  }
}

export class ChecklistIncompleteError extends ComplianceError {
  public readonly kind = "compliance.checklist.incomplete";

  public constructor(subjectId: string, missing: readonly string[]) {
    super(`Checklist for subject ${subjectId} is incomplete — missing: ${missing.join(", ")}.`);
  }
}

export class ChecklistValidationError extends ComplianceError {
  public readonly kind = "compliance.checklist.validation";

  public constructor(message: string) {
    super(`Checklist validation failed: ${message}`);
  }
}

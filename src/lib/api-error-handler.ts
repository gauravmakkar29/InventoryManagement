/**
 * IMS Gen 2 — GraphQL Mutation Error Handler
 *
 * Centralised error handling for GraphQL mutation responses.
 * Surfaces server-side errors, authorization failures, and unexpected
 * empty responses via Sonner toast notifications so users are never
 * left in the dark when a mutation fails.
 *
 * Enforces NIST 800-53 AU-6 (audit-visible error surfacing) and
 * SI-10 (input validation at system boundaries).
 */

import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape returned by AppSync / GraphQL mutation responses. */
export interface MutationResult<T> {
  data: T | null;
  errors?: Array<{ message: string; errorType?: string }>;
}

/** Custom error class so callers can distinguish API errors from bugs. */
export class ApiMutationError extends Error {
  constructor(
    message: string,
    public readonly operationName: string,
    public readonly errorType?: string,
  ) {
    super(message);
    this.name = "ApiMutationError";
  }
}

// ---------------------------------------------------------------------------
// Human-readable operation labels
// ---------------------------------------------------------------------------

const OPERATION_LABELS: Record<string, string> = {
  createServiceOrder: "Create service order",
  updateServiceOrder: "Update service order",
  uploadFirmware: "Upload firmware",
  approveFirmware: "Approve firmware",
  deprecateFirmware: "Deprecate firmware",
  activateFirmware: "Reactivate firmware",
  submitComplianceReview: "Submit compliance review",
  approveComplianceItem: "Approve compliance item",
  deprecateComplianceItem: "Deprecate compliance item",
  acknowledgeNotification: "Acknowledge notification",
  createDevice: "Create device",
  updateDeviceStatus: "Update device status",
  createIncident: "Create incident",
  updateIncidentStatus: "Update incident status",
  isolateDevice: "Isolate device",
  releaseDevice: "Release device",
  uploadSBOM: "Upload SBOM",
  updateVulnerabilityStatus: "Update vulnerability status",
};

function labelFor(operationName: string): string {
  return OPERATION_LABELS[operationName] ?? operationName;
}

// ---------------------------------------------------------------------------
// Core handler
// ---------------------------------------------------------------------------

/**
 * Inspects a GraphQL mutation result for errors and throws an
 * `ApiMutationError` (with a user-facing toast) when something is wrong.
 *
 * Order of checks:
 *  1. GraphQL `errors` array — may contain auth / validation failures
 *  2. Null `data` — unexpected empty response from the server
 *
 * On success the unwrapped `data` value (guaranteed non-null) is returned.
 */
export function handleMutationResult<T>(result: MutationResult<T>, operationName: string): T {
  // 1. Check for GraphQL errors
  if (result.errors && result.errors.length > 0) {
    const first = result.errors[0] as { message: string; errorType?: string };
    const errorType = first.errorType ?? "";
    const isAuthError =
      errorType === "Unauthorized" ||
      errorType === "403" ||
      /unauthorized|forbidden|insufficient.?perm/i.test(first.message);

    const userMessage = isAuthError
      ? `${labelFor(operationName)} failed: Insufficient permissions`
      : `${labelFor(operationName)} failed: ${first.message}`;

    toast.error(userMessage);

    throw new ApiMutationError(userMessage, operationName, errorType || undefined);
  }

  // 2. Check for null data
  if (result.data === null || result.data === undefined) {
    const userMessage = `${labelFor(operationName)} failed: Unexpected empty response`;
    toast.error(userMessage);
    throw new ApiMutationError(userMessage, operationName);
  }

  return result.data;
}

/**
 * Convenience wrapper for boolean mutation results (e.g. acknowledgeNotification).
 * GraphQL boolean mutations don't return rich objects — they return `true/false`
 * directly, so the check is slightly different.
 */
export function handleBooleanMutationResult(
  result: MutationResult<boolean>,
  operationName: string,
): boolean {
  // Check for GraphQL errors first
  if (result.errors && result.errors.length > 0) {
    const first = result.errors[0] as { message: string; errorType?: string };
    const errorType = first.errorType ?? "";
    const isAuthError =
      errorType === "Unauthorized" ||
      errorType === "403" ||
      /unauthorized|forbidden|insufficient.?perm/i.test(first.message);

    const userMessage = isAuthError
      ? `${labelFor(operationName)} failed: Insufficient permissions`
      : `${labelFor(operationName)} failed: ${first.message}`;

    toast.error(userMessage);
    throw new ApiMutationError(userMessage, operationName, errorType || undefined);
  }

  // For boolean mutations, false is a valid response (not an error)
  if (result.data === null || result.data === undefined) {
    const userMessage = `${labelFor(operationName)} failed: Unexpected empty response`;
    toast.error(userMessage);
    throw new ApiMutationError(userMessage, operationName);
  }

  return result.data;
}

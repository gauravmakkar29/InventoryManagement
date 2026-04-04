import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleMutationResult,
  handleBooleanMutationResult,
  ApiMutationError,
  type MutationResult,
} from "@/lib/api-error-handler";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { toast } from "sonner";

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// handleMutationResult
// =============================================================================

describe("handleMutationResult", () => {
  it("returns data when result is successful", () => {
    const result: MutationResult<{ id: string }> = { data: { id: "so-1" } };
    const data = handleMutationResult(result, "createServiceOrder");
    expect(data).toEqual({ id: "so-1" });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("throws ApiMutationError and toasts on GraphQL errors", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "Validation failed: title is required" }],
    };
    expect(() => handleMutationResult(result, "createServiceOrder")).toThrow(ApiMutationError);
    expect(() => handleMutationResult(result, "createServiceOrder")).toThrow(
      "Create service order failed: Validation failed: title is required",
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Create service order failed: Validation failed: title is required",
    );
  });

  it("shows 'Insufficient permissions' for Unauthorized errorType", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "Not authorized", errorType: "Unauthorized" }],
    };
    expect(() => handleMutationResult(result, "uploadFirmware")).toThrow(
      "Upload firmware failed: Insufficient permissions",
    );
    expect(toast.error).toHaveBeenCalledWith("Upload firmware failed: Insufficient permissions");
  });

  it("shows 'Insufficient permissions' for 403 errorType", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "Forbidden", errorType: "403" }],
    };
    expect(() => handleMutationResult(result, "approveFirmware")).toThrow(
      "Approve firmware failed: Insufficient permissions",
    );
  });

  it("shows 'Insufficient permissions' for message containing 'forbidden'", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "Access forbidden for this resource" }],
    };
    expect(() => handleMutationResult(result, "submitComplianceReview")).toThrow(
      "Submit compliance review failed: Insufficient permissions",
    );
  });

  it("shows 'Insufficient permissions' for message containing 'insufficient permissions'", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "User has insufficient permissions" }],
    };
    expect(() => handleMutationResult(result, "updateServiceOrder")).toThrow(
      "Update service order failed: Insufficient permissions",
    );
  });

  it("throws on null data with 'Unexpected empty response'", () => {
    const result: MutationResult<{ id: string }> = { data: null };
    expect(() => handleMutationResult(result, "createServiceOrder")).toThrow(
      "Create service order failed: Unexpected empty response",
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Create service order failed: Unexpected empty response",
    );
  });

  it("throws on undefined data with 'Unexpected empty response'", () => {
    const result = { data: undefined } as unknown as MutationResult<{ id: string }>;
    expect(() => handleMutationResult(result, "uploadFirmware")).toThrow(
      "Upload firmware failed: Unexpected empty response",
    );
  });

  it("uses first error when multiple GraphQL errors exist", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "First error" }, { message: "Second error" }],
    };
    expect(() => handleMutationResult(result, "createServiceOrder")).toThrow(
      "Create service order failed: First error",
    );
  });

  it("thrown error has correct operationName and errorType", () => {
    const result: MutationResult<{ id: string }> = {
      data: null,
      errors: [{ message: "Bad input", errorType: "ValidationError" }],
    };
    try {
      handleMutationResult(result, "uploadFirmware");
      expect.unreachable("Should have thrown");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiMutationError);
      const apiErr = error as ApiMutationError;
      expect(apiErr.operationName).toBe("uploadFirmware");
      expect(apiErr.errorType).toBe("ValidationError");
    }
  });

  it("falls back to operationName when no label mapping exists", () => {
    const result: MutationResult<{ id: string }> = { data: null };
    expect(() => handleMutationResult(result, "unknownMutation")).toThrow(
      "unknownMutation failed: Unexpected empty response",
    );
  });
});

// =============================================================================
// handleBooleanMutationResult
// =============================================================================

describe("handleBooleanMutationResult", () => {
  it("returns true when result data is true", () => {
    const result: MutationResult<boolean> = { data: true };
    expect(handleBooleanMutationResult(result, "acknowledgeNotification")).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("returns false when result data is false (not treated as error)", () => {
    const result: MutationResult<boolean> = { data: false };
    expect(handleBooleanMutationResult(result, "acknowledgeNotification")).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("throws on GraphQL errors", () => {
    const result: MutationResult<boolean> = {
      data: null,
      errors: [{ message: "Notification not found" }],
    };
    expect(() => handleBooleanMutationResult(result, "acknowledgeNotification")).toThrow(
      "Acknowledge notification failed: Notification not found",
    );
    expect(toast.error).toHaveBeenCalled();
  });

  it("throws on null data", () => {
    const result: MutationResult<boolean> = { data: null };
    expect(() => handleBooleanMutationResult(result, "acknowledgeNotification")).toThrow(
      "Acknowledge notification failed: Unexpected empty response",
    );
  });

  it("detects auth errors in boolean mutation", () => {
    const result: MutationResult<boolean> = {
      data: null,
      errors: [{ message: "Unauthorized", errorType: "Unauthorized" }],
    };
    expect(() => handleBooleanMutationResult(result, "acknowledgeNotification")).toThrow(
      "Acknowledge notification failed: Insufficient permissions",
    );
  });
});

// =============================================================================
// ApiMutationError
// =============================================================================

describe("ApiMutationError", () => {
  it("is an instance of Error", () => {
    const err = new ApiMutationError("test", "op");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiMutationError");
  });

  it("stores operationName and optional errorType", () => {
    const err = new ApiMutationError("msg", "uploadFirmware", "ValidationError");
    expect(err.operationName).toBe("uploadFirmware");
    expect(err.errorType).toBe("ValidationError");
    expect(err.message).toBe("msg");
  });

  it("errorType is undefined when not provided", () => {
    const err = new ApiMutationError("msg", "op");
    expect(err.errorType).toBeUndefined();
  });
});

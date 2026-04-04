import { z } from "zod";

/**
 * Zod schema for firmware assignment creation.
 * Enforces SI-10 (Input Validation) — all fields validated at system boundary.
 *
 * @see Story 26.9 (#362) — FirmwareAssignment Entity
 */
export const createAssignmentSchema = z.object({
  deviceId: z.string().min(1, "Device is required"),
  firmwareId: z.string().min(1, "Firmware is required"),
  assignmentMethod: z.enum(["DOWNLOAD_TOKEN", "MANUAL", "OTA"]),
  downloadTokenId: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

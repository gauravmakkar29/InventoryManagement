import { z } from "zod";

/**
 * Zod schema for download token generation form.
 * Enforces SI-10 (Input Validation) — all fields validated at system boundary.
 *
 * @see Story 26.4 (#357) — Download Token Generation
 */
export const generateTokenSchema = z.object({
  firmwareId: z.string().min(1, "Firmware is required"),
  userId: z.string().min(1, "Technician is required"),
  expiresInHours: z.number().min(1).max(168, "Maximum 7 days"),
});

export type GenerateTokenInput = z.infer<typeof generateTokenSchema>;

/**
 * IMS Gen 2 — Auth Session Zod Schema
 *
 * Validates session data read from localStorage before trusting it.
 * Enforces SI-10 (Input Validation) for deserialized session objects.
 *
 * @see Story #348 — Zod validation on localStorage session parsing
 */

import { z } from "zod";

export const AuthSessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string(),
    groups: z.array(z.string()),
    customerId: z.string().optional(),
    lastLogin: z.string(),
    isActive: z.boolean(),
  }),
  groups: z.array(z.string()),
  customerId: z.string().nullable(),
  accessTokenExpiresAt: z.number(),
  refreshTokenExpiresAt: z.number(),
});

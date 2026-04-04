/**
 * Unit tests for AuthSessionSchema (Story #348)
 *
 * Validates that Zod schema correctly accepts valid sessions and
 * rejects malformed/tampered localStorage data (SI-10).
 */

import { describe, it, expect } from "vitest";
import { AuthSessionSchema } from "@/lib/schemas/auth-session.schema";

const validSession = {
  user: {
    id: "user-123",
    email: "admin@example.com",
    name: "Admin User",
    groups: ["Admin"],
    customerId: "cust-001",
    lastLogin: "2026-01-01T00:00:00.000Z",
    isActive: true,
  },
  groups: ["Admin"],
  customerId: "cust-001",
  accessTokenExpiresAt: Date.now() + 3600_000,
  refreshTokenExpiresAt: Date.now() + 30 * 24 * 3600_000,
};

describe("AuthSessionSchema", () => {
  it("accepts a valid session object", () => {
    const result = AuthSessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it("accepts session with null customerId", () => {
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      customerId: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts session without optional user.customerId", () => {
    const { customerId: _, ...userWithoutCustomerId } = validSession.user;
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      user: userWithoutCustomerId,
    });
    expect(result.success).toBe(true);
  });

  it("rejects session with empty user.id", () => {
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      user: { ...validSession.user, id: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects session with invalid email", () => {
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      user: { ...validSession.user, email: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects session missing user field", () => {
    const { user: _, ...noUser } = validSession;
    const result = AuthSessionSchema.safeParse(noUser);
    expect(result.success).toBe(false);
  });

  it("rejects session missing accessTokenExpiresAt", () => {
    const { accessTokenExpiresAt: _, ...noExpiry } = validSession;
    const result = AuthSessionSchema.safeParse(noExpiry);
    expect(result.success).toBe(false);
  });

  it("rejects session missing refreshTokenExpiresAt", () => {
    const { refreshTokenExpiresAt: _, ...noRefreshExpiry } = validSession;
    const result = AuthSessionSchema.safeParse(noRefreshExpiry);
    expect(result.success).toBe(false);
  });

  it("rejects session with non-array groups", () => {
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      groups: "Admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(AuthSessionSchema.safeParse(null).success).toBe(false);
    expect(AuthSessionSchema.safeParse("string").success).toBe(false);
    expect(AuthSessionSchema.safeParse(42).success).toBe(false);
    expect(AuthSessionSchema.safeParse(undefined).success).toBe(false);
  });

  it("rejects session with string instead of number for accessTokenExpiresAt", () => {
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      accessTokenExpiresAt: "not-a-number",
    });
    expect(result.success).toBe(false);
  });

  it("rejects session with missing user.isActive", () => {
    const { isActive: _, ...userWithoutActive } = validSession.user;
    const result = AuthSessionSchema.safeParse({
      ...validSession,
      user: userWithoutActive,
    });
    expect(result.success).toBe(false);
  });
});

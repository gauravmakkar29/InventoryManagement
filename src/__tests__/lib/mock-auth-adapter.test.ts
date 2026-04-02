import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockAuthAdapter } from "@/lib/providers/mock/mock-auth-adapter";
import type { IAuthAdapter } from "@/lib/providers/auth-adapter";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  }),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("MockAuthAdapter", () => {
  let adapter: IAuthAdapter;

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    vi.clearAllMocks();
    adapter = createMockAuthAdapter({ networkDelay: 0 });
  });

  // ===========================================================================
  // signIn
  // ===========================================================================

  describe("signIn", () => {
    it("returns a session for valid credentials", async () => {
      const result = await adapter.signIn("admin@company.com", "Admin@12345678");

      expect(result.mfaRequired).toBe(false);
      expect(result.session).not.toBeNull();
      expect(result.session?.user.email).toBe("admin@company.com");
      expect(result.session?.groups).toContain("Admin");
    });

    it("throws for invalid credentials", async () => {
      await expect(adapter.signIn("admin@company.com", "wrong")).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("throws for unknown email", async () => {
      await expect(adapter.signIn("nobody@company.com", "anything")).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("derives correct roles from email patterns", async () => {
      const cases = [
        ["admin@company.com", "Admin@12345678", "Admin"],
        ["manager@company.com", "Manager@12345678", "Manager"],
        ["tech@company.com", "Tech@123456789", "Technician"],
        ["viewer@company.com", "Viewer@12345678", "Viewer"],
        ["customer@tenant.com", "Customer@123456", "CustomerAdmin"],
      ] as const;

      for (const [email, password, expectedRole] of cases) {
        const result = await adapter.signIn(email, password);
        expect(result.session?.user.groups).toContain(expectedRole);
      }
    });

    it("sets customerId for CustomerAdmin role", async () => {
      const result = await adapter.signIn("customer@tenant.com", "Customer@123456");
      expect(result.session?.customerId).toBe("cust-001");
    });

    it("does not set customerId for non-customer roles", async () => {
      const result = await adapter.signIn("admin@company.com", "Admin@12345678");
      expect(result.session?.customerId).toBeNull();
    });

    it("returns mfaRequired when MFA is enabled for the user", async () => {
      // Enable MFA for admin
      await adapter.confirmMfaSetup("123456", "admin@company.com");

      const result = await adapter.signIn("admin@company.com", "Admin@12345678");
      expect(result.mfaRequired).toBe(true);
      expect(result.session).toBeNull();
    });
  });

  // ===========================================================================
  // signOut
  // ===========================================================================

  describe("signOut", () => {
    it("clears pending MFA session", async () => {
      await adapter.confirmMfaSetup("123456", "admin@company.com");
      await adapter.signIn("admin@company.com", "Admin@12345678");
      await adapter.signOut();

      // verifyMfa should fail — no pending session
      await expect(adapter.verifyMfa("123456")).rejects.toThrow("MFA session expired");
    });
  });

  // ===========================================================================
  // MFA
  // ===========================================================================

  describe("MFA flow", () => {
    it("verifyMfa returns session after valid code", async () => {
      await adapter.confirmMfaSetup("123456", "admin@company.com");
      await adapter.signIn("admin@company.com", "Admin@12345678");

      const session = await adapter.verifyMfa("654321");
      expect(session.user.email).toBe("admin@company.com");
      expect(session.groups).toContain("Admin");
    });

    it("verifyMfa rejects invalid code format", async () => {
      await adapter.confirmMfaSetup("123456", "admin@company.com");
      await adapter.signIn("admin@company.com", "Admin@12345678");

      await expect(adapter.verifyMfa("abc")).rejects.toThrow("Invalid verification code");
    });

    it("verifyMfa rejects when no pending session", async () => {
      await expect(adapter.verifyMfa("123456")).rejects.toThrow("MFA session expired");
    });

    it("setupMfa returns a TOTP URI", async () => {
      const uri = await adapter.setupMfa("admin@company.com");
      expect(uri).toContain("otpauth://totp/IMS-Gen2:");
      expect(uri).toContain("admin@company.com");
      expect(uri).toContain("secret=");
    });

    it("confirmMfaSetup enables MFA for the email", async () => {
      expect(adapter.isMfaEnabled("admin@company.com")).toBe(false);
      await adapter.confirmMfaSetup("123456", "admin@company.com");
      expect(adapter.isMfaEnabled("admin@company.com")).toBe(true);
    });

    it("confirmMfaSetup rejects invalid code", async () => {
      await expect(adapter.confirmMfaSetup("abc", "admin@company.com")).rejects.toThrow(
        "Invalid verification code",
      );
    });

    it("isMfaEnabled is case-insensitive", async () => {
      await adapter.confirmMfaSetup("123456", "Admin@Company.com");
      expect(adapter.isMfaEnabled("admin@company.com")).toBe(true);
      expect(adapter.isMfaEnabled("ADMIN@COMPANY.COM")).toBe(true);
    });
  });

  // ===========================================================================
  // Token refresh
  // ===========================================================================

  describe("refreshToken", () => {
    it("returns updated session with extended expiry", async () => {
      const signInResult = await adapter.signIn("admin@company.com", "Admin@12345678");
      // Simulate a session whose access token is about to expire
      const session = {
        ...signInResult.session!,
        accessTokenExpiresAt: Date.now() - 1000,
      };

      const refreshed = await adapter.refreshToken(session);
      expect(refreshed).not.toBeNull();
      expect(refreshed!.accessTokenExpiresAt).toBeGreaterThan(session.accessTokenExpiresAt);
      expect(refreshed!.user.email).toBe("admin@company.com");
    });

    it("returns null when refresh token is expired", async () => {
      const signInResult = await adapter.signIn("admin@company.com", "Admin@12345678");
      const session = {
        ...signInResult.session!,
        refreshTokenExpiresAt: Date.now() - 1000, // expired
      };

      const refreshed = await adapter.refreshToken(session);
      expect(refreshed).toBeNull();
    });
  });

  // ===========================================================================
  // Session persistence
  // ===========================================================================

  describe("session persistence", () => {
    it("saveSession + loadSession round-trips correctly", async () => {
      const result = await adapter.signIn("admin@company.com", "Admin@12345678");
      const session = result.session!;

      adapter.saveSession(session);
      const loaded = adapter.loadSession();

      expect(loaded).not.toBeNull();
      expect(loaded!.user.email).toBe("admin@company.com");
      expect(loaded!.groups).toContain("Admin");
    });

    it("loadSession returns null when nothing is stored", () => {
      expect(adapter.loadSession()).toBeNull();
    });

    it("clearSession removes the stored session", async () => {
      const result = await adapter.signIn("admin@company.com", "Admin@12345678");
      adapter.saveSession(result.session!);
      adapter.clearSession();

      expect(adapter.loadSession()).toBeNull();
    });
  });

  // ===========================================================================
  // Configuration
  // ===========================================================================

  describe("configuration", () => {
    it("has refresh interval and threshold", () => {
      expect(adapter.refreshIntervalMs).toBeGreaterThan(0);
      expect(adapter.refreshThresholdMs).toBeGreaterThan(0);
    });

    it("accepts custom credentials", async () => {
      const custom = createMockAuthAdapter({
        credentials: { "test@test.com": "Test@123" },
        networkDelay: 0,
      });

      const result = await custom.signIn("test@test.com", "Test@123");
      expect(result.session).not.toBeNull();

      // Original credentials should not work
      await expect(custom.signIn("admin@company.com", "Admin@12345678")).rejects.toThrow();
    });
  });
});

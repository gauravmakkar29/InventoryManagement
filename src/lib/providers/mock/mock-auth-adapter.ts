/**
 * Mock Auth Adapter — simulates IdP behaviour for local development.
 *
 * Credentials, roles, and MFA are fully configurable. No cloud SDK needed.
 * Swap this for CognitoAuthAdapter (or any other) via VITE_PLATFORM.
 */

import type { User } from "../../types";
import type { IAuthAdapter, AuthSession, SignInResult } from "../auth-adapter";

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = "ims-auth";
const MFA_STORAGE_KEY = "ims-mfa-enabled";

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_CHECK_INTERVAL_MS = 30 * 1000; // check every 30s
const REFRESH_THRESHOLD_MS = 60 * 1000; // refresh when <1 min left

const MOCK_TOTP_SECRET = "JBSWY3DPEHPK3PXP";

/** Default mock credential store — configurable at creation time. */
const DEFAULT_CREDENTIALS: Record<string, string> = {
  "admin@company.com": "Admin@12345678",
  "manager@company.com": "Manager@12345678",
  "tech@company.com": "Tech@123456789",
  "viewer@company.com": "Viewer@12345678",
  "customer@tenant.com": "Customer@123456",
};

// =============================================================================
// Helpers
// =============================================================================

function deriveRole(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.includes("admin")) return "Admin";
  if (local.includes("manager")) return "Manager";
  if (local.includes("tech")) return "Technician";
  if (local.includes("viewer")) return "Viewer";
  if (local.includes("customer")) return "CustomerAdmin";
  return "Viewer";
}

function createMockUser(email: string): User {
  const role = deriveRole(email);
  return {
    id: `usr-${Date.now().toString(36)}`,
    email: email.toLowerCase(),
    name: email.split("@")[0] ?? email,
    groups: [role],
    customerId: role === "CustomerAdmin" ? "cust-001" : undefined,
    lastLogin: new Date().toISOString(),
    isActive: true,
  };
}

function createSession(user: User): AuthSession {
  const now = Date.now();
  return {
    user,
    groups: user.groups,
    customerId: user.customerId ?? null,
    accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL_MS,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// MFA persistence helpers
// =============================================================================

function loadMfaEmails(): string[] {
  try {
    const raw = localStorage.getItem(MFA_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveMfaEmails(emails: string[]): void {
  localStorage.setItem(MFA_STORAGE_KEY, JSON.stringify(emails));
}

// =============================================================================
// Factory
// =============================================================================

export interface MockAuthAdapterOptions {
  /** Override the default credential store. */
  credentials?: Record<string, string>;
  /** Simulated network delay in ms (default: 500). */
  networkDelay?: number;
}

export function createMockAuthAdapter(options?: MockAuthAdapterOptions): IAuthAdapter {
  const credentials = options?.credentials ?? DEFAULT_CREDENTIALS;
  const networkDelay = options?.networkDelay ?? 500;

  // Pending MFA session — lives in adapter closure, not React state
  let pendingSession: AuthSession | null = null;

  const adapter: IAuthAdapter = {
    // --- Config ---
    refreshIntervalMs: REFRESH_CHECK_INTERVAL_MS,
    refreshThresholdMs: REFRESH_THRESHOLD_MS,

    // --- Core Auth ---

    async signIn(email: string, password: string): Promise<SignInResult> {
      await delay(networkDelay);

      const stored = credentials[email.toLowerCase()];
      if (!stored || stored !== password) {
        throw new Error("Invalid email or password. Please try again.");
      }

      const user = createMockUser(email);
      const session = createSession(user);

      if (adapter.isMfaEnabled(email)) {
        pendingSession = session;
        return { session: null, mfaRequired: true };
      }

      return { session, mfaRequired: false };
    },

    async signOut(): Promise<void> {
      pendingSession = null;
    },

    async refreshToken(session: AuthSession): Promise<AuthSession | null> {
      const now = Date.now();
      if (now >= session.refreshTokenExpiresAt) {
        return null;
      }
      return {
        ...session,
        accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
      };
    },

    // --- MFA ---

    async verifyMfa(code: string): Promise<AuthSession> {
      await delay(networkDelay * 0.8);

      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid verification code. Please try again.");
      }

      if (!pendingSession) {
        throw new Error("MFA session expired. Please sign in again.");
      }

      const session = pendingSession;
      pendingSession = null;
      return session;
    },

    async setupMfa(email: string): Promise<string> {
      await delay(networkDelay * 0.6);
      return `otpauth://totp/IMS-Gen2:${email}?secret=${MOCK_TOTP_SECRET}&issuer=IMS-Gen2`;
    },

    async confirmMfaSetup(code: string, email: string): Promise<void> {
      await delay(networkDelay * 0.8);

      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid verification code");
      }

      const emails = loadMfaEmails();
      const lower = email.toLowerCase();
      if (!emails.includes(lower)) {
        emails.push(lower);
        saveMfaEmails(emails);
      }
    },

    isMfaEnabled(email: string): boolean {
      return loadMfaEmails().includes(email.toLowerCase());
    },

    // --- Session Persistence ---

    loadSession(): AuthSession | null {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthSession;
      } catch {
        return null;
      }
    },

    saveSession(session: AuthSession): void {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    },

    clearSession(): void {
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  return adapter;
}

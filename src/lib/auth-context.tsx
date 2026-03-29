import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthContext } from "./auth-context-instance";
import type { User } from "./types";

const STORAGE_KEY = "ims-auth";
const MFA_STORAGE_KEY = "ims-mfa-enabled";

/** Token expiry constants (mock — mirrors Cognito config) */
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_CHECK_INTERVAL_MS = 30 * 1000; // check every 30s
const REFRESH_THRESHOLD_MS = 60 * 1000; // refresh when <1 min left

/** Mock TOTP secret for QR code generation. */
const MOCK_TOTP_SECRET = "JBSWY3DPEHPK3PXP";

interface StoredAuth {
  user: User;
  email: string;
  groups: string[];
  customerId: string | null;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function persistAuth(data: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Check if MFA is enabled for an email (persisted in localStorage). */
function isMfaEnabledForEmail(email: string): boolean {
  try {
    const raw = localStorage.getItem(MFA_STORAGE_KEY);
    if (!raw) return false;
    const enabled = JSON.parse(raw) as string[];
    return enabled.includes(email.toLowerCase());
  } catch {
    return false;
  }
}

/** Enable MFA for an email (persisted in localStorage). */
function enableMfaForEmail(email: string): void {
  try {
    const raw = localStorage.getItem(MFA_STORAGE_KEY);
    const enabled = raw ? (JSON.parse(raw) as string[]) : [];
    if (!enabled.includes(email.toLowerCase())) {
      enabled.push(email.toLowerCase());
    }
    localStorage.setItem(MFA_STORAGE_KEY, JSON.stringify(enabled));
  } catch {
    // ignore
  }
}

/** Mock credential store — replaced by Cognito in production. */
const MOCK_CREDENTIALS: Record<string, string> = {
  "admin@company.com": "Admin@12345678",
  "manager@company.com": "Manager@12345678",
  "tech@company.com": "Tech@123456789",
  "viewer@company.com": "Viewer@12345678",
  "customer@tenant.com": "Customer@123456",
};

/** Derive role from email for mock auth. */
function deriveRole(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.includes("admin")) return "Admin";
  if (local.includes("manager")) return "Manager";
  if (local.includes("tech")) return "Technician";
  if (local.includes("viewer")) return "Viewer";
  if (local.includes("customer")) return "CustomerAdmin";
  return "Viewer";
}

/**
 * AuthProvider with session management, MFA support, and RBAC.
 * Replace with Cognito / real IdP integration in production.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const pendingUserRef = useRef<{ user: User; authData: StoredAuth } | null>(null);
  const storedAuthRef = useRef<StoredAuth | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Clear refresh interval. */
  const stopRefreshLoop = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  /** Force logout and redirect. */
  const forceLogout = useCallback(
    (message?: string) => {
      stopRefreshLoop();
      clearAuth();
      storedAuthRef.current = null;
      pendingUserRef.current = null;
      setUser(null);
      setMfaRequired(false);
      if (message) {
        toast.warning(message);
      }
    },
    [stopRefreshLoop],
  );

  /** Simulate token refresh — extends access token. */
  const refreshAccessToken = useCallback(() => {
    const stored = storedAuthRef.current ?? loadStoredAuth();
    if (!stored) return;

    const now = Date.now();

    // Check refresh token expiry first
    if (now >= stored.refreshTokenExpiresAt) {
      forceLogout("Session expired. Please sign in again.");
      return;
    }

    // Check if access token needs refreshing
    const timeLeft = stored.accessTokenExpiresAt - now;
    if (timeLeft > REFRESH_THRESHOLD_MS) return; // still fresh

    // Simulate refresh — in production this calls Cognito
    try {
      const updated: StoredAuth = {
        ...stored,
        accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
      };
      persistAuth(updated);
      storedAuthRef.current = updated;
    } catch {
      toast.warning("Unable to refresh session");
    }
  }, [forceLogout]);

  /** Start the background refresh loop. */
  const startRefreshLoop = useCallback(() => {
    stopRefreshLoop();
    refreshIntervalRef.current = setInterval(refreshAccessToken, REFRESH_CHECK_INTERVAL_MS);
  }, [refreshAccessToken, stopRefreshLoop]);

  // Restore session on mount
  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      const now = Date.now();
      // If refresh token expired, force logout
      if (now >= stored.refreshTokenExpiresAt) {
        clearAuth();
        toast.warning("Session expired. Please sign in again.");
      } else {
        // Refresh access token if needed
        if (now >= stored.accessTokenExpiresAt) {
          stored.accessTokenExpiresAt = now + ACCESS_TOKEN_TTL_MS;
          persistAuth(stored);
        }
        storedAuthRef.current = stored;
        setUser(stored.user);
        setMfaEnabled(isMfaEnabledForEmail(stored.email));
      }
    }
    setIsLoading(false);
  }, []);

  // Start/stop refresh loop based on auth state
  useEffect(() => {
    if (user) {
      startRefreshLoop();
    } else {
      stopRefreshLoop();
    }
    return stopRefreshLoop;
  }, [user, startRefreshLoop, stopRefreshLoop]);

  const signIn = useCallback(async (email: string, password: string) => {
    setSignInError(null);
    setMfaRequired(false);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Check credentials against mock store
    const storedPassword = MOCK_CREDENTIALS[email.toLowerCase()];
    if (!storedPassword || storedPassword !== password) {
      setSignInError("Invalid email or password. Please try again.");
      throw new Error("Invalid credentials");
    }

    const role = deriveRole(email);
    const now = Date.now();
    const mockUser: User = {
      id: `usr-${now.toString(36)}`,
      email: email.toLowerCase(),
      name: email.split("@")[0] ?? email,
      groups: [role],
      customerId: role === "CustomerAdmin" ? "cust-001" : undefined,
      lastLogin: new Date().toISOString(),
      isActive: true,
    };

    const authData: StoredAuth = {
      user: mockUser,
      email: mockUser.email,
      groups: mockUser.groups,
      customerId: mockUser.customerId ?? null,
      accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
      refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL_MS,
    };

    // Check if MFA is enabled for this user
    if (isMfaEnabledForEmail(email)) {
      pendingUserRef.current = { user: mockUser, authData };
      setMfaRequired(true);
      setSignInError(null);
      return; // Don't complete sign-in yet — wait for MFA verification
    }

    // No MFA — complete sign-in
    persistAuth(authData);
    storedAuthRef.current = authData;
    setUser(mockUser);
    setMfaEnabled(isMfaEnabledForEmail(email));
    setSignInError(null);
  }, []);

  /** Verify MFA code during sign-in. */
  const verifyMfa = useCallback(async (code: string) => {
    setSignInError(null);
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Mock: accept any 6-digit code
    if (!/^\d{6}$/.test(code)) {
      setSignInError("Invalid verification code. Please try again.");
      throw new Error("Invalid MFA code");
    }

    const pending = pendingUserRef.current;
    if (!pending) {
      setSignInError("MFA session expired. Please sign in again.");
      throw new Error("No pending MFA session");
    }

    persistAuth(pending.authData);
    storedAuthRef.current = pending.authData;
    setUser(pending.user);
    setMfaRequired(false);
    setMfaEnabled(true);
    pendingUserRef.current = null;
    setSignInError(null);
  }, []);

  /** Start MFA setup — returns TOTP URI for QR code. */
  const setupMfa = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const email = user?.email ?? "user@company.com";
    return `otpauth://totp/IMS-Gen2:${email}?secret=${MOCK_TOTP_SECRET}&issuer=IMS-Gen2`;
  }, [user]);

  /** Confirm MFA setup with verification code. */
  const confirmMfaSetup = useCallback(
    async (code: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid verification code");
      }

      // Enable MFA for this user
      if (user?.email) {
        enableMfaForEmail(user.email);
        setMfaEnabled(true);
        toast.success("MFA enabled successfully");
      }
    },
    [user],
  );

  const signOut = useCallback(() => {
    stopRefreshLoop();
    clearAuth();
    storedAuthRef.current = null;
    pendingUserRef.current = null;
    setUser(null);
    setMfaRequired(false);
    setSignInError(null);
  }, [stopRefreshLoop]);

  return (
    <AuthContext.Provider
      value={{
        user,
        email: user?.email ?? null,
        groups: user?.groups ?? [],
        isAuthenticated: !!user,
        isLoading,
        customerId: user?.customerId ?? null,
        signInError,
        mfaRequired,
        mfaEnabled,
        signIn,
        verifyMfa,
        setupMfa,
        confirmMfaSetup,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

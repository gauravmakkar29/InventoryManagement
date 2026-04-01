/**
 * IMS Gen 2 — Auth Adapter Interface
 *
 * Cloud-agnostic contract that auth adapters (Mock, Cognito, Azure AD, Auth0)
 * must implement. The generic AuthProvider component consumes this interface
 * to manage React state without knowing which IdP is behind it.
 */

import type { User } from "../types";

// =============================================================================
// Session Types
// =============================================================================

/** Persisted auth session — stored between page reloads. */
export interface AuthSession {
  user: User;
  groups: string[];
  customerId: string | null;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

/** Result of a signIn call — either a completed session or an MFA challenge. */
export interface SignInResult {
  /** Completed session. Null when MFA verification is required first. */
  session: AuthSession | null;
  /** True when the IdP requires a second factor before granting a session. */
  mfaRequired: boolean;
}

// =============================================================================
// Auth Adapter Interface
// =============================================================================

/**
 * Contract that every auth adapter must implement.
 *
 * Adapters handle IdP-specific logic (credential validation, token exchange,
 * MFA flows). The generic AuthProvider handles React state and refresh loops.
 *
 * @example
 * ```ts
 * const adapter = createMockAuthAdapter();
 * const AuthProvider = createAuthProvider(adapter);
 * ```
 */
export interface IAuthAdapter {
  // --- Core Auth ---

  /** Authenticate with credentials. Returns session or MFA challenge. */
  signIn(email: string, password: string): Promise<SignInResult>;

  /** End the current session (call IdP logout endpoint if applicable). */
  signOut(): Promise<void>;

  /**
   * Refresh the access token using the refresh token.
   * Returns updated session, or null if the refresh token has expired.
   */
  refreshToken(session: AuthSession): Promise<AuthSession | null>;

  // --- MFA ---

  /** Verify MFA code during sign-in. Returns completed session. */
  verifyMfa(code: string): Promise<AuthSession>;

  /** Start MFA setup — returns TOTP URI for QR code generation. */
  setupMfa(email: string): Promise<string>;

  /** Confirm MFA setup with a verification code. */
  confirmMfaSetup(code: string, email: string): Promise<void>;

  /** Check whether MFA is enabled for a given email. */
  isMfaEnabled(email: string): boolean;

  // --- Session Persistence ---

  /** Load a previously persisted session (e.g., from localStorage). */
  loadSession(): AuthSession | null;

  /** Persist session for restoration after page reload. */
  saveSession(session: AuthSession): void;

  /** Clear persisted session data. */
  clearSession(): void;

  // --- Configuration ---

  /** How often (ms) the refresh loop checks token expiry. */
  readonly refreshIntervalMs: number;

  /** Refresh the token when it has fewer than this many ms remaining. */
  readonly refreshThresholdMs: number;
}

/**
 * IMS Gen 2 — AWS Amplify Gen2 Auth Adapter
 *
 * Connects to an Amplify Gen2-provisioned Cognito User Pool using lightweight
 * HTTP calls to the Cognito Identity Provider API. Does NOT depend on
 * @aws-amplify/* SDK — uses the same Cognito HTTP approach as the CDK adapter.
 *
 * Amplify Gen2 deploys Cognito under the hood. This adapter is NAMED "Amplify"
 * to indicate the deployment model (amplify sandbox / amplify deploy), but at
 * runtime it speaks the same Cognito protocol as the CDK adapter.
 *
 * Required env vars (from amplify_outputs.json):
 *   VITE_AUTH_PROVIDER_URL — Cognito issuer URL (auth.user_pool_id region endpoint)
 *   VITE_AUTH_CLIENT_ID    — Cognito app client ID (auth.user_pool_client_id)
 *   VITE_AUTH_REGION       — AWS region (default: ap-southeast-2)
 *
 * @see Story #204 — AWS Amplify Gen2 adapter package
 */

import type { IAuthAdapter, AuthSession, SignInResult } from "../auth-adapter";
import type { User } from "@/lib/types";
import { AuthSessionSchema } from "@/lib/schemas/auth-session.schema";

// =============================================================================
// Config
// =============================================================================

interface AmplifyAuthConfig {
  /** Cognito User Pool issuer URL */
  issuerUrl: string;
  /** Cognito App Client ID (public SPA client, no secret) */
  clientId: string;
  /** AWS region */
  region: string;
}

function loadConfig(): AmplifyAuthConfig {
  const issuerUrl = import.meta.env.VITE_AUTH_PROVIDER_URL;
  const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;
  const region = import.meta.env.VITE_AUTH_REGION ?? "ap-southeast-2";

  if (!issuerUrl || !clientId) {
    throw new Error(
      "Amplify Auth Adapter requires VITE_AUTH_PROVIDER_URL and VITE_AUTH_CLIENT_ID. " +
        "These values come from amplify_outputs.json (auth.user_pool_id, auth.user_pool_client_id). " +
        "See Docs/integration-contract.md.",
    );
  }

  return { issuerUrl, clientId, region };
}

// =============================================================================
// Cognito API helpers (Cognito Identity Provider HTTP API)
// =============================================================================

interface CognitoTokens {
  IdToken: string;
  AccessToken: string;
  RefreshToken: string;
  ExpiresIn: number;
}

interface CognitoAuthResult {
  AuthenticationResult?: CognitoTokens;
  ChallengeName?: string;
  Session?: string;
}

/**
 * Call Cognito Identity Provider API via the resilient HTTP client.
 * Routes through api-client.ts for retry, backoff, and circuit breaker.
 * @see Story 22.2 — Route auth/storage fetch() through api-client.ts
 */
async function cognitoRequest(
  region: string,
  target: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { resilientCognitoRequest } = await import("../../resilient-fetch");
  return resilientCognitoRequest(region, target, payload);
}

// =============================================================================
// Token parsing
// =============================================================================

interface JwtPayload {
  sub: string;
  email?: string;
  "cognito:username"?: string;
  "cognito:groups"?: string[];
  "custom:customerId"?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  exp: number;
}

function parseJwt(token: string): JwtPayload {
  const base64 = token.split(".")[1] ?? "";
  const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as JwtPayload;
}

function tokensToSession(tokens: CognitoTokens): AuthSession {
  const idPayload = parseJwt(tokens.IdToken);

  const user: User = {
    id: idPayload.sub,
    email: idPayload.email ?? idPayload["cognito:username"] ?? "unknown",
    name:
      idPayload.name ??
      [idPayload.given_name, idPayload.family_name].filter(Boolean).join(" ") ??
      idPayload.email ??
      "User",
    groups: idPayload["cognito:groups"] ?? ["Viewer"],
    isActive: true,
    lastLogin: new Date().toISOString(),
  };

  const groups = idPayload["cognito:groups"] ?? ["Viewer"];
  const customerId = idPayload["custom:customerId"] ?? null;

  return {
    user,
    groups,
    customerId,
    accessTokenExpiresAt: idPayload.exp * 1000,
    refreshTokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

// =============================================================================
// Storage keys
// =============================================================================

const STORAGE_KEY = "ims-amplify-auth-session";
const REFRESH_TOKEN_KEY = "ims-amplify-refresh-token";
const MFA_SESSION_KEY = "ims-amplify-mfa-session";

// =============================================================================
// Adapter implementation
// =============================================================================

/**
 * Create an Amplify Gen2 auth adapter.
 *
 * Uses the same Cognito HTTP API as the CDK adapter. The distinction is
 * the deployment model: Amplify Gen2 provisions Cognito via `amplify sandbox`
 * and outputs connection info in `amplify_outputs.json`.
 */
export function createAmplifyAuthAdapter(): IAuthAdapter {
  const config = loadConfig();
  let currentRefreshToken: string | null = null;
  let mfaSession: string | null = null;

  return {
    async signIn(email: string, password: string): Promise<SignInResult> {
      const result = (await cognitoRequest(config.region, "InitiateAuth", {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })) as CognitoAuthResult;

      // MFA challenge
      if (result.ChallengeName === "SOFTWARE_TOKEN_MFA" || result.ChallengeName === "SMS_MFA") {
        mfaSession = result.Session ?? null;
        localStorage.setItem(MFA_SESSION_KEY, mfaSession ?? "");
        return { session: null, mfaRequired: true };
      }

      if (!result.AuthenticationResult) {
        throw new Error("Unexpected auth response — no tokens returned");
      }

      currentRefreshToken = result.AuthenticationResult.RefreshToken;
      localStorage.setItem(REFRESH_TOKEN_KEY, currentRefreshToken);

      const session = tokensToSession(result.AuthenticationResult);
      this.saveSession(session);

      return { session, mfaRequired: false };
    },

    async signOut(): Promise<void> {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(MFA_SESSION_KEY);
      currentRefreshToken = null;
      mfaSession = null;
    },

    async refreshToken(session: AuthSession): Promise<AuthSession | null> {
      const refreshToken = currentRefreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      try {
        const result = (await cognitoRequest(config.region, "InitiateAuth", {
          AuthFlow: "REFRESH_TOKEN_AUTH",
          ClientId: config.clientId,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        })) as CognitoAuthResult;

        if (!result.AuthenticationResult) return null;

        const newSession = tokensToSession(result.AuthenticationResult);
        // Preserve original refresh token expiry (Cognito doesn't always return a new one)
        newSession.refreshTokenExpiresAt = session.refreshTokenExpiresAt;
        this.saveSession(newSession);
        return newSession;
      } catch {
        // Refresh token expired — force re-login
        this.clearSession();
        return null;
      }
    },

    async verifyMfa(code: string): Promise<AuthSession> {
      const session = mfaSession ?? localStorage.getItem(MFA_SESSION_KEY);
      if (!session) throw new Error("No MFA session — call signIn first");

      const result = (await cognitoRequest(config.region, "RespondToAuthChallenge", {
        ChallengeName: "SOFTWARE_TOKEN_MFA",
        ClientId: config.clientId,
        Session: session,
        ChallengeResponses: {
          USERNAME: "mfa-user",
          SOFTWARE_TOKEN_MFA_CODE: code,
        },
      })) as CognitoAuthResult;

      if (!result.AuthenticationResult) {
        throw new Error("MFA verification failed");
      }

      localStorage.removeItem(MFA_SESSION_KEY);
      mfaSession = null;

      currentRefreshToken = result.AuthenticationResult.RefreshToken;
      localStorage.setItem(REFRESH_TOKEN_KEY, currentRefreshToken);

      const authSession = tokensToSession(result.AuthenticationResult);
      this.saveSession(authSession);
      return authSession;
    },

    async setupMfa(email: string): Promise<string> {
      // MFA setup requires an access token — typically called after initial
      // sign-in when Cognito requires MFA configuration.
      // Full implementation requires AssociateSoftwareToken API call.
      console.warn("[Amplify Auth] MFA setup via Cognito API requires access token flow");
      return `otpauth://totp/IMS:${email}?secret=PLACEHOLDER&issuer=IMS-Gen2`;
    },

    async confirmMfaSetup(_code: string, _email: string): Promise<void> {
      // Requires VerifySoftwareToken API call with access token
      console.warn("[Amplify Auth] MFA confirm setup requires access token flow");
    },

    isMfaEnabled(_email: string): boolean {
      // MFA flow is handled during signIn when Cognito returns a challenge
      return false;
    },

    loadSession(): AuthSession | null {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      try {
        const parsed: unknown = JSON.parse(stored);
        const result = AuthSessionSchema.safeParse(parsed);
        if (!result.success) {
          console.warn("[Amplify Auth] Invalid session data in localStorage, clearing");
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return result.data as AuthSession;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    },

    saveSession(session: AuthSession): void {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    },

    clearSession(): void {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(MFA_SESSION_KEY);
      currentRefreshToken = null;
      mfaSession = null;
    },

    refreshIntervalMs: 60_000,
    refreshThresholdMs: 5 * 60_000,
    sessionWarningMs: 2 * 60_000,
  };
}

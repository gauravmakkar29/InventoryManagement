/**
 * IMS Gen 2 — AWS Terraform Auth Adapter
 *
 * Connects to a Terraform-provisioned Cognito User Pool using lightweight
 * AWS SDK calls. Delegates to the same Cognito HTTP API used by the CDK
 * adapter — Terraform and CDK both provision the same AWS service.
 *
 * Required env vars (see Docs/integration-contract.md):
 *   VITE_AUTH_PROVIDER_URL — Cognito issuer URL (from terraform output)
 *   VITE_AUTH_CLIENT_ID    — Cognito app client ID (from terraform output)
 *   VITE_AUTH_REGION       — AWS region (default: ap-southeast-2)
 *
 * @see Story #207 — Terraform adapter package
 */

import type { IAuthAdapter, AuthSession, SignInResult } from "../auth-adapter";
import type { User } from "@/lib/types";
import { AuthSessionSchema } from "@/lib/schemas/auth-session.schema";

// =============================================================================
// Config
// =============================================================================

interface TerraformAuthConfig {
  /** Cognito User Pool issuer URL */
  issuerUrl: string;
  /** Cognito App Client ID (public SPA client, no secret) */
  clientId: string;
  /** AWS region */
  region: string;
}

function loadConfig(): TerraformAuthConfig {
  const issuerUrl = import.meta.env.VITE_AUTH_PROVIDER_URL;
  const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;
  const region = import.meta.env.VITE_AUTH_REGION ?? "ap-southeast-2";

  if (!issuerUrl || !clientId) {
    throw new Error(
      "Terraform Auth Adapter requires VITE_AUTH_PROVIDER_URL and VITE_AUTH_CLIENT_ID. " +
        "These values come from Terraform outputs. See Docs/integration-contract.md.",
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
 * Call Cognito Identity Provider API via HTTP (no SDK dependency).
 * Uses the public API with X-Amz-Target header for USER_PASSWORD_AUTH
 * and REFRESH_TOKEN_AUTH flows.
 */
async function cognitoRequest(
  region: string,
  target: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as { __type?: string; message?: string };
    throw new Error(error.message ?? `Cognito ${target} failed: ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
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

const STORAGE_KEY = "ims-terraform-auth-session";
const REFRESH_TOKEN_KEY = "ims-terraform-refresh-token";
const MFA_SESSION_KEY = "ims-terraform-mfa-session";

// =============================================================================
// Adapter implementation
// =============================================================================

export function createTerraformAuthAdapter(): IAuthAdapter {
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
        // Preserve original refresh token (Cognito doesn't always return a new one)
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
          USERNAME: "mfa-user", // Cognito echoes this from the challenge
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
      // MFA setup requires an access token — this is typically called
      // after initial sign-in when Cognito requires MFA configuration.
      // Full implementation requires AssociateSoftwareToken API call.
      console.warn("[Terraform Auth] MFA setup via Cognito API requires access token flow");
      return `otpauth://totp/IMS:${email}?secret=PLACEHOLDER&issuer=IMS-Gen2`;
    },

    async confirmMfaSetup(_code: string, _email: string): Promise<void> {
      // Requires VerifySoftwareToken API call with access token
      console.warn("[Terraform Auth] MFA confirm setup requires access token flow");
    },

    isMfaEnabled(_email: string): boolean {
      // MFA status comes from Cognito during the signIn challenge flow
      return false;
    },

    loadSession(): AuthSession | null {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      try {
        const parsed: unknown = JSON.parse(stored);
        const result = AuthSessionSchema.safeParse(parsed);
        if (!result.success) {
          console.warn("[Terraform Auth] Invalid session data in localStorage, clearing");
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

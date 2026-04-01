/**
 * Cognito Auth Adapter — wraps AWS Amplify v6 Auth behind IAuthAdapter.
 *
 * This adapter is ready for real Cognito integration. Replace the placeholder
 * calls with actual Amplify SDK imports when connecting to a Cognito User Pool.
 *
 * Required packages (install when activating):
 *   npm install aws-amplify @aws-amplify/auth
 *
 * Required env vars:
 *   VITE_COGNITO_USER_POOL_ID
 *   VITE_COGNITO_CLIENT_ID
 *   VITE_COGNITO_REGION
 *
 * @see Story #204 — AWS Amplify Gen2 adapter (full activation)
 */

import type { User } from "../../types";
import type { IAuthAdapter, AuthSession, SignInResult } from "../auth-adapter";

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = "ims-auth";
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // Cognito default: 1 hour
const REFRESH_CHECK_INTERVAL_MS = 30 * 1000;
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // refresh 5 min before expiry
const SESSION_WARNING_MS = 2 * 60 * 1000; // warn user at T-2 minutes

// =============================================================================
// Helpers
// =============================================================================

/**
 * Map Cognito user attributes + groups to the app's User type.
 * Cognito returns attributes like email, name, sub, custom:customerId.
 */
function mapCognitoUser(cognitoUser: Record<string, string>, groups: string[]): User {
  return {
    id: cognitoUser["sub"] ?? "",
    email: cognitoUser["email"] ?? "",
    name: cognitoUser["name"] ?? cognitoUser["email"]?.split("@")[0] ?? "",
    groups,
    customerId: cognitoUser["custom:customerId"] ?? undefined,
    lastLogin: new Date().toISOString(),
    isActive: true,
  };
}

function createSessionFromTokens(
  user: User,
  accessTokenExpiry: number,
  refreshTokenExpiry: number,
): AuthSession {
  return {
    user,
    groups: user.groups,
    customerId: user.customerId ?? null,
    accessTokenExpiresAt: accessTokenExpiry,
    refreshTokenExpiresAt: refreshTokenExpiry,
  };
}

// =============================================================================
// Factory
// =============================================================================

export interface CognitoAuthAdapterOptions {
  userPoolId: string;
  clientId: string;
  region: string;
}

export function createCognitoAuthAdapter(options: CognitoAuthAdapterOptions): IAuthAdapter {
  // When activating, configure Amplify here:
  // Amplify.configure({
  //   Auth: {
  //     Cognito: {
  //       userPoolId: options.userPoolId,
  //       userPoolClientId: options.clientId,
  //     },
  //   },
  // });

  void options; // used during Amplify.configure activation

  const adapter: IAuthAdapter = {
    refreshIntervalMs: REFRESH_CHECK_INTERVAL_MS,
    refreshThresholdMs: REFRESH_THRESHOLD_MS,
    sessionWarningMs: SESSION_WARNING_MS,

    async signIn(email: string, password: string): Promise<SignInResult> {
      // Real implementation:
      // const result = await signIn({ username: email, password });
      //
      // if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
      //   return { session: null, mfaRequired: true };
      // }
      //
      // const session = await fetchAuthSession();
      // const attributes = await fetchUserAttributes();
      // const groups = session.tokens?.accessToken.payload["cognito:groups"] as string[] ?? [];
      // const user = mapCognitoUser(attributes, groups);
      // const expiry = session.tokens?.accessToken.payload.exp ?? 0;
      //
      // return {
      //   session: createSessionFromTokens(user, expiry * 1000, Date.now() + 30 * 24 * 60 * 60 * 1000),
      //   mfaRequired: false,
      // };

      void email;
      void password;
      throw new Error(
        "CognitoAuthAdapter is not yet activated. " +
          "Install aws-amplify and uncomment the implementation. See Story #204.",
      );
    },

    async signOut(): Promise<void> {
      // Real implementation:
      // await amplifySignOut({ global: true });
      throw new Error("CognitoAuthAdapter is not yet activated.");
    },

    async refreshToken(session: AuthSession): Promise<AuthSession | null> {
      // Real implementation:
      // const authSession = await fetchAuthSession({ forceRefresh: true });
      // if (!authSession.tokens) return null;
      // const expiry = authSession.tokens.accessToken.payload.exp ?? 0;
      // return { ...session, accessTokenExpiresAt: expiry * 1000 };

      void session;
      throw new Error("CognitoAuthAdapter is not yet activated.");
    },

    async verifyMfa(code: string): Promise<AuthSession> {
      // Real implementation:
      // const result = await confirmSignIn({ challengeResponse: code });
      // if (result.isSignedIn) {
      //   const session = await fetchAuthSession();
      //   const attributes = await fetchUserAttributes();
      //   const groups = session.tokens?.accessToken.payload["cognito:groups"] as string[] ?? [];
      //   const user = mapCognitoUser(attributes, groups);
      //   return createSessionFromTokens(user, ...);
      // }

      void code;
      throw new Error("CognitoAuthAdapter is not yet activated.");
    },

    async setupMfa(email: string): Promise<string> {
      // Real implementation:
      // const result = await setUpTOTP();
      // return result.getSetupUri("IMS-Gen2", email).toString();

      void email;
      throw new Error("CognitoAuthAdapter is not yet activated.");
    },

    async confirmMfaSetup(code: string, _email: string): Promise<void> {
      // Real implementation:
      // await verifyTOTPSetup({ code });

      void code;
      throw new Error("CognitoAuthAdapter is not yet activated.");
    },

    isMfaEnabled(_email: string): boolean {
      // With Cognito, MFA status comes from the user pool config
      // and the user's MFA preferences. Check via fetchMFAPreference().
      return false;
    },

    // --- Session Persistence ---
    // Amplify manages its own token storage, but we persist the app-level
    // session for fast hydration on reload.

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

  // Export helpers for testing
  void mapCognitoUser;
  void createSessionFromTokens;
  void ACCESS_TOKEN_TTL_MS;

  return adapter;
}

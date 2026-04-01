/**
 * IMS Gen 2 — Generic Auth Provider
 *
 * Cloud-agnostic React component that manages auth state using any IAuthAdapter.
 * Components consume auth via the existing useAuth() hook — they never know
 * which IdP is behind the adapter.
 *
 * Usage:
 *   const MyAuthProvider = createAuthProvider(myAdapter);
 *   <MyAuthProvider>{children}</MyAuthProvider>
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type ComponentType,
} from "react";
import { toast } from "sonner";
import { AuthContext } from "../auth-context-instance";
import type { IAuthAdapter, AuthSession } from "./auth-adapter";

/**
 * Factory that creates an AuthProvider component bound to a specific adapter.
 * The adapter instance is captured in closure — one per platform.
 */
export function createAuthProvider(adapter: IAuthAdapter): ComponentType<{ children: ReactNode }> {
  function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState(adapter.loadSession()?.user ?? null);
    const [isLoading, setIsLoading] = useState(true);
    const [signInError, setSignInError] = useState<string | null>(null);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState(false);

    const sessionRef = useRef<AuthSession | null>(null);
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- Refresh loop ---

    const stopRefreshLoop = useCallback(() => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }, []);

    const forceLogout = useCallback(
      (message?: string) => {
        stopRefreshLoop();
        adapter.clearSession();
        sessionRef.current = null;
        setUser(null);
        setMfaRequired(false);
        setSignInError(null);
        if (message) {
          toast.warning(message);
        }
      },
      [stopRefreshLoop],
    );

    const checkAndRefreshToken = useCallback(async () => {
      const session = sessionRef.current ?? adapter.loadSession();
      if (!session) return;

      const now = Date.now();

      if (now >= session.refreshTokenExpiresAt) {
        forceLogout("Session expired. Please sign in again.");
        return;
      }

      const timeLeft = session.accessTokenExpiresAt - now;
      if (timeLeft > adapter.refreshThresholdMs) return;

      try {
        const updated = await adapter.refreshToken(session);
        if (!updated) {
          forceLogout("Session expired. Please sign in again.");
          return;
        }
        adapter.saveSession(updated);
        sessionRef.current = updated;
      } catch {
        toast.warning("Unable to refresh session");
      }
    }, [forceLogout]);

    const startRefreshLoop = useCallback(() => {
      stopRefreshLoop();
      refreshIntervalRef.current = setInterval(checkAndRefreshToken, adapter.refreshIntervalMs);
    }, [checkAndRefreshToken, stopRefreshLoop]);

    // --- Restore session on mount ---

    useEffect(() => {
      const stored = adapter.loadSession();
      if (stored) {
        const now = Date.now();
        if (now >= stored.refreshTokenExpiresAt) {
          adapter.clearSession();
          toast.warning("Session expired. Please sign in again.");
        } else {
          if (now >= stored.accessTokenExpiresAt) {
            adapter
              .refreshToken(stored)
              .then((updated) => {
                if (updated) {
                  adapter.saveSession(updated);
                  sessionRef.current = updated;
                  setUser(updated.user);
                  setMfaEnabled(adapter.isMfaEnabled(updated.user.email));
                } else {
                  adapter.clearSession();
                }
              })
              .catch(() => {
                adapter.clearSession();
              });
          } else {
            sessionRef.current = stored;
            setUser(stored.user);
            setMfaEnabled(adapter.isMfaEnabled(stored.user.email));
          }
        }
      }
      setIsLoading(false);
    }, []);

    // --- Start/stop refresh loop based on auth state ---

    useEffect(() => {
      if (user) {
        startRefreshLoop();
      } else {
        stopRefreshLoop();
      }
      return stopRefreshLoop;
    }, [user, startRefreshLoop, stopRefreshLoop]);

    // --- Auth actions ---

    const signIn = useCallback(async (email: string, password: string) => {
      setSignInError(null);
      setMfaRequired(false);

      try {
        const result = await adapter.signIn(email, password);

        if (result.mfaRequired) {
          setMfaRequired(true);
          return;
        }

        if (result.session) {
          adapter.saveSession(result.session);
          sessionRef.current = result.session;
          setUser(result.session.user);
          setMfaEnabled(adapter.isMfaEnabled(email));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
        setSignInError(message);
        throw err;
      }
    }, []);

    const verifyMfa = useCallback(async (code: string) => {
      setSignInError(null);

      try {
        const session = await adapter.verifyMfa(code);
        adapter.saveSession(session);
        sessionRef.current = session;
        setUser(session.user);
        setMfaRequired(false);
        setMfaEnabled(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid verification code.";
        setSignInError(message);
        throw err;
      }
    }, []);

    const setupMfa = useCallback(async () => {
      const email = user?.email ?? "user@company.com";
      return adapter.setupMfa(email);
    }, [user]);

    const confirmMfaSetup = useCallback(
      async (code: string) => {
        if (!user?.email) return;
        await adapter.confirmMfaSetup(code, user.email);
        setMfaEnabled(true);
        toast.success("MFA enabled successfully");
      },
      [user],
    );

    const signOut = useCallback(async () => {
      stopRefreshLoop();
      await adapter.signOut();
      adapter.clearSession();
      sessionRef.current = null;
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

  AuthProvider.displayName = "AuthProvider";
  return AuthProvider;
}

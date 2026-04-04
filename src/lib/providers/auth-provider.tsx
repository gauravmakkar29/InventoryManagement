/**
 * IMS Gen 2 — Generic Auth Provider
 *
 * Cloud-agnostic React component that manages auth state using any IAuthAdapter.
 * Features: silent token refresh, session expiry warnings, multi-tab sync.
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type ComponentType,
} from "react";
import { toast } from "sonner";
import { AuthContext } from "../auth-context-instance";
import type { IAuthAdapter, AuthSession } from "./auth-adapter";

const BROADCAST_CHANNEL_NAME = "ims-auth-sync";

type AuthSyncMessage = { type: "SIGN_OUT" } | { type: "SESSION_UPDATED"; session: AuthSession };

/**
 * Factory that creates an AuthProvider component bound to a specific adapter.
 */
export function createAuthProvider(adapter: IAuthAdapter): ComponentType<{ children: ReactNode }> {
  function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState(adapter.loadSession()?.user ?? null);
    const [isLoading, setIsLoading] = useState(true);
    const [signInError, setSignInError] = useState<string | null>(null);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [sessionExpiring, setSessionExpiring] = useState(false);

    const sessionRef = useRef<AuthSession | null>(null);
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const channelRef = useRef<BroadcastChannel | null>(null);

    // --- BroadcastChannel for multi-tab sync ---

    const getBroadcastChannel = useCallback(() => {
      if (!channelRef.current && typeof BroadcastChannel !== "undefined") {
        channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      }
      return channelRef.current;
    }, []);

    const broadcastMessage = useCallback(
      (msg: AuthSyncMessage) => {
        try {
          getBroadcastChannel()?.postMessage(msg);
        } catch {
          // BroadcastChannel not supported — single-tab fallback
        }
      },
      [getBroadcastChannel],
    );

    // --- Refresh loop ---

    const stopRefreshLoop = useCallback(() => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }, []);

    const forceLogout = useCallback(
      (message?: string, broadcast = true) => {
        stopRefreshLoop();
        adapter.clearSession();
        sessionRef.current = null;
        setUser(null);
        setMfaRequired(false);
        setSignInError(null);
        setSessionExpiring(false);
        if (broadcast) {
          broadcastMessage({ type: "SIGN_OUT" });
        }
        if (message) {
          toast.warning(message);
        }
      },
      [stopRefreshLoop, broadcastMessage],
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

      // Session expiry warning
      if (timeLeft <= adapter.sessionWarningMs && timeLeft > 0) {
        setSessionExpiring(true);
      } else {
        setSessionExpiring(false);
      }

      if (timeLeft > adapter.refreshThresholdMs) return;

      try {
        const updated = await adapter.refreshToken(session);
        if (!updated) {
          forceLogout("Session expired. Please sign in again.");
          return;
        }
        adapter.saveSession(updated);
        sessionRef.current = updated;
        setSessionExpiring(false);
        broadcastMessage({ type: "SESSION_UPDATED", session: updated });
      } catch {
        toast.warning("Unable to refresh session");
      }
    }, [forceLogout, broadcastMessage]);

    const startRefreshLoop = useCallback(() => {
      stopRefreshLoop();
      refreshIntervalRef.current = setInterval(checkAndRefreshToken, adapter.refreshIntervalMs);
    }, [checkAndRefreshToken, stopRefreshLoop]);

    // --- Extend session (user clicks "Keep me signed in") ---

    const extendSession = useCallback(async () => {
      const session = sessionRef.current ?? adapter.loadSession();
      if (!session) return;

      try {
        const updated = await adapter.refreshToken(session);
        if (!updated) {
          forceLogout("Unable to extend session. Please sign in again.");
          return;
        }
        adapter.saveSession(updated);
        sessionRef.current = updated;
        setSessionExpiring(false);
        broadcastMessage({ type: "SESSION_UPDATED", session: updated });
        toast.success("Session extended");
      } catch {
        toast.warning("Unable to extend session");
      }
    }, [forceLogout, broadcastMessage]);

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

    // --- Multi-tab sync listener ---

    useEffect(() => {
      const channel = getBroadcastChannel();
      if (!channel) return;

      const handleMessage = (event: MessageEvent<AuthSyncMessage>) => {
        const msg = event.data;
        if (msg.type === "SIGN_OUT") {
          // Another tab signed out — mirror locally without re-broadcasting
          stopRefreshLoop();
          adapter.clearSession();
          sessionRef.current = null;
          setUser(null);
          setMfaRequired(false);
          setSignInError(null);
          setSessionExpiring(false);
          toast.info("Signed out from another tab");
        } else if (msg.type === "SESSION_UPDATED") {
          // Another tab refreshed — update our local state
          adapter.saveSession(msg.session);
          sessionRef.current = msg.session;
          setUser(msg.session.user);
          setSessionExpiring(false);
        }
      };

      channel.addEventListener("message", handleMessage);
      return () => {
        channel.removeEventListener("message", handleMessage);
      };
    }, [getBroadcastChannel, stopRefreshLoop]);

    // --- Start/stop refresh loop based on auth state ---

    useEffect(() => {
      if (user) {
        startRefreshLoop();
      } else {
        stopRefreshLoop();
      }
      return stopRefreshLoop;
    }, [user, startRefreshLoop, stopRefreshLoop]);

    // --- Cleanup BroadcastChannel on unmount ---

    useEffect(() => {
      return () => {
        channelRef.current?.close();
        channelRef.current = null;
      };
    }, []);

    // --- Auth actions ---

    const signIn = useCallback(
      async (email: string, password: string) => {
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
            broadcastMessage({ type: "SESSION_UPDATED", session: result.session });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
          setSignInError(message);
          throw err;
        }
      },
      [broadcastMessage],
    );

    const verifyMfa = useCallback(
      async (code: string) => {
        setSignInError(null);

        try {
          const session = await adapter.verifyMfa(code);
          adapter.saveSession(session);
          sessionRef.current = session;
          setUser(session.user);
          setMfaRequired(false);
          setMfaEnabled(true);
          broadcastMessage({ type: "SESSION_UPDATED", session });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid verification code.";
          setSignInError(message);
          throw err;
        }
      },
      [broadcastMessage],
    );

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
      setSessionExpiring(false);
      broadcastMessage({ type: "SIGN_OUT" });
    }, [stopRefreshLoop, broadcastMessage]);

    // Memoize groups to prevent new array ref when user is null (#310)
    const groups = useMemo(() => user?.groups ?? [], [user?.groups]);

    const contextValue = useMemo(
      () => ({
        user,
        email: user?.email ?? null,
        groups,
        isAuthenticated: !!user,
        isLoading,
        customerId: user?.customerId ?? null,
        signInError,
        mfaRequired,
        mfaEnabled,
        sessionExpiring,
        signIn,
        verifyMfa,
        setupMfa,
        confirmMfaSetup,
        signOut,
        extendSession,
      }),
      [
        user,
        groups,
        isLoading,
        signInError,
        mfaRequired,
        mfaEnabled,
        sessionExpiring,
        signIn,
        verifyMfa,
        setupMfa,
        confirmMfaSetup,
        signOut,
        extendSession,
      ],
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
  }

  AuthProvider.displayName = "AuthProvider";
  return AuthProvider;
}

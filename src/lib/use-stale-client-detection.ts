/**
 * IMS Gen 2 — Stale Client Detection Hook
 *
 * Reads X-Deployed-Version from API response headers,
 * compares with the running app version, and shows a
 * non-blocking toast when a newer version is available.
 *
 * Only notifies once per session (sessionStorage flag).
 *
 * @see Story #232 — Application versioning strategy
 */

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { APP_BUILD_INFO, isStale } from "./app-version";

const SESSION_KEY = "ims:stale-client-notified";

export interface StaleClientDetectionOptions {
  /** Response header name for deployed version. Defaults to "x-deployed-version". */
  headerName?: string;
}

export interface StaleClientDetection {
  /** Call after each API response to check for version mismatch. */
  checkResponse: (headers: Record<string, string>) => void;
  /** Whether a stale notification has been shown this session. */
  isNotified: () => boolean;
}

/**
 * Hook that detects when a newer version of the application has been deployed
 * and shows a non-blocking Sonner toast prompting the user to refresh.
 */
export function useStaleClientDetection(
  options?: StaleClientDetectionOptions,
): StaleClientDetection {
  const headerName = options?.headerName ?? "x-deployed-version";
  const notifiedRef = useRef(false);

  const isNotified = useCallback((): boolean => {
    if (notifiedRef.current) return true;
    try {
      return sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  const checkResponse = useCallback(
    (headers: Record<string, string>): void => {
      if (isNotified()) return;

      const deployedVersion =
        headers[headerName] ?? headers[headerName.toLowerCase()];
      if (!deployedVersion) return;

      if (isStale(APP_BUILD_INFO.version, deployedVersion)) {
        notifiedRef.current = true;
        try {
          sessionStorage.setItem(SESSION_KEY, "true");
        } catch {
          // sessionStorage unavailable — still show toast
        }

        toast.info("A new version is available. Refresh to update.", {
          duration: 10_000,
          action: {
            label: "Refresh",
            onClick: () => {
              window.location.reload();
            },
          },
        });
      }
    },
    [headerName, isNotified],
  );

  return { checkResponse, isNotified };
}

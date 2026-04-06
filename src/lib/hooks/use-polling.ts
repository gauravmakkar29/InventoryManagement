/**
 * IMS Gen 2 — usePolling Hook
 *
 * Visibility-aware polling with exponential backoff on error.
 * Pauses when the browser tab is hidden, resumes immediately on focus.
 *
 * For TanStack Query data fetching, prefer `refetchInterval` +
 * `refetchIntervalInBackground: false` instead of this hook.
 *
 * @see Story #296 — Coordinate polling intervals
 */

import { useEffect, useRef, useCallback } from "react";

interface UsePollingOptions {
  /** Pause polling when document is hidden (default: true) */
  pauseOnHidden?: boolean;
  /** Apply exponential backoff on error (default: true) */
  backoffOnError?: boolean;
  /** Maximum interval cap as multiplier of base interval (default: 5) */
  maxBackoffMultiplier?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Runs a callback at a regular interval with visibility awareness
 * and exponential backoff on failure.
 *
 * @param callback - Async function to call on each tick
 * @param intervalMs - Base polling interval in milliseconds
 * @param options - Configuration options
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: UsePollingOptions = {},
): void {
  const {
    pauseOnHidden = true,
    backoffOnError = true,
    maxBackoffMultiplier = 5,
    enabled = true,
  } = options;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const currentIntervalRef = useRef(intervalMs);

  const tick = useCallback(async () => {
    if (pauseOnHidden && document.hidden) return;

    try {
      await callbackRef.current();
      // Reset interval on success
      currentIntervalRef.current = intervalMs;
    } catch {
      if (backoffOnError) {
        const maxInterval = intervalMs * maxBackoffMultiplier;
        currentIntervalRef.current = Math.min(currentIntervalRef.current * 1.5, maxInterval);
      }
    }
  }, [intervalMs, pauseOnHidden, backoffOnError, maxBackoffMultiplier]);

  useEffect(() => {
    if (!enabled) return;

    currentIntervalRef.current = intervalMs;
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timeoutId = setTimeout(async () => {
        await tick();
        schedule();
      }, currentIntervalRef.current);
    };

    // Start first tick after initial interval
    schedule();

    // Resume immediately when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden) {
        clearTimeout(timeoutId);
        tick().then(schedule);
      }
    };

    if (pauseOnHidden) {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      clearTimeout(timeoutId);
      if (pauseOnHidden) {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [intervalMs, enabled, tick, pauseOnHidden]);
}

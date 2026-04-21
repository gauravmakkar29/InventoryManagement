/**
 * `useSlaWatch` — polls the approval engine at a fixed interval to detect
 * pending→breached condition transitions and fire alert callbacks
 * (Story 28.4 AC8).
 *
 * Behavior:
 * - 60-second default interval
 * - Visibility-aware: pauses when `document.visibilityState === "hidden"`
 *   (performance rulebook §6 — backoff when tab is hidden)
 * - Duplicate suppression by `{conditionId, milestone}` key — each milestone
 *   fires at most once per watch session even if the clock re-enters the
 *   active range (breach-audit idempotency is the adapter's job; this hook
 *   is responsible for UX signal idempotency).
 */

import { useEffect, useRef } from "react";

import type { IApprovalEngine } from "./approval-engine.interface";
import type { Approval } from "./approval-state-machine";
import { computeAlertMilestones, type AlertMilestone } from "./sla-tracker";

export interface UseSlaWatchOptions {
  readonly engine: IApprovalEngine;
  readonly approvalId: string;
  readonly intervalMs?: number;
  readonly now?: () => Date;
  readonly onAlert?: (event: {
    readonly approvalId: string;
    readonly conditionId: string;
    readonly milestone: AlertMilestone;
    readonly approval: Approval;
  }) => void;
}

const DEFAULT_INTERVAL_MS = 60_000;

export function useSlaWatch({
  engine,
  approvalId,
  intervalMs = DEFAULT_INTERVAL_MS,
  now = () => new Date(),
  onAlert,
}: UseSlaWatchOptions): void {
  const emittedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function tick(): Promise<void> {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      const refreshed = await engine.refreshSlaStatus(approvalId);
      if (cancelled) return;
      const clock = now();
      for (const c of refreshed.conditions) {
        const milestones = computeAlertMilestones(c, clock);
        for (const m of milestones) {
          const dedupKey = `${c.id}:${m}`;
          if (emittedRef.current.has(dedupKey)) continue;
          emittedRef.current.add(dedupKey);
          onAlert?.({ approvalId, conditionId: c.id, milestone: m, approval: refreshed });
        }
      }
    }

    void tick();
    const handle = setInterval(() => void tick(), intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }
    return () => {
      cancelled = true;
      clearInterval(handle);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [engine, approvalId, intervalMs, now, onAlert]);
}

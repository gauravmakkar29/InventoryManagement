/**
 * SLA tracker for conditional approvals (Story 28.4).
 *
 * Pure, side-effect-free evaluators that compute condition status and
 * alert-milestone fire-set at any given moment. Adapter wiring (auto-create
 * on conditional decide, auto-satisfy on slot attach, breach audit
 * idempotency) lives in `mock-approval-engine.ts`; the evaluators here are
 * unit-testable in isolation with a mocked clock.
 *
 * NIST controls: AU-2 / AU-3 (breach transitions audit-logged by adapter),
 * SI-10 (due-date parse validation), AC-3 (markConditionSatisfied gated by
 * canPerformAction at the adapter boundary).
 */

import type { SlaCondition } from "./approval-state-machine";

export type AlertMilestone = "T-7d" | "T-1d" | "T+0";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the runtime status of a condition given the current clock.
 *
 * `satisfied` is sticky — once a condition is marked satisfied it stays so
 * regardless of time. `pending` flips to `breached` the moment `dueAt < now`.
 */
export function evaluateSlaStatus(condition: SlaCondition, now: Date): SlaCondition["status"] {
  if (condition.status === "satisfied") return "satisfied";
  const due = Date.parse(condition.dueAt);
  if (Number.isNaN(due)) return condition.status;
  return due <= now.getTime() ? "breached" : "pending";
}

/**
 * Return which milestones are currently active for a condition. Callers are
 * expected to suppress duplicate emissions using `{conditionId, milestone}`
 * as the dedup key — this function only reports what *should* be fired based
 * on the current clock, not what has already been emitted.
 *
 * Active set semantics:
 * - T-7d active when `-7d < remaining ≤ -1d` (i.e., 1-7 days remaining)
 * - T-1d active when `-1d < remaining ≤ 0` (i.e., 0-1 days remaining)
 * - T+0  active when `remaining ≤ 0` (breached)
 */
export function computeAlertMilestones(
  condition: SlaCondition,
  now: Date,
): readonly AlertMilestone[] {
  if (condition.status === "satisfied") return [];
  const due = Date.parse(condition.dueAt);
  if (Number.isNaN(due)) return [];

  const remainingMs = due - now.getTime();
  const out: AlertMilestone[] = [];
  if (remainingMs <= 0) {
    out.push("T+0");
    return out;
  }
  if (remainingMs <= MS_PER_DAY) {
    out.push("T-1d");
    return out;
  }
  if (remainingMs <= 7 * MS_PER_DAY) {
    out.push("T-7d");
    return out;
  }
  return out;
}

/** Human-readable time-remaining string. Updates once per minute by caller. */
export function formatRemaining(condition: SlaCondition, now: Date): string {
  const due = Date.parse(condition.dueAt);
  if (Number.isNaN(due)) return "invalid due date";
  const diff = due - now.getTime();
  if (diff <= 0) {
    const overdueDays = Math.floor(-diff / MS_PER_DAY);
    if (overdueDays > 0) return `overdue ${overdueDays}d`;
    const overdueHours = Math.floor(-diff / (60 * 60 * 1000));
    return overdueHours > 0 ? `overdue ${overdueHours}h` : "overdue";
  }
  const days = Math.floor(diff / MS_PER_DAY);
  if (days > 0) {
    const hours = Math.floor((diff - days * MS_PER_DAY) / (60 * 60 * 1000));
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours > 0) return `${hours}h`;
  const minutes = Math.max(1, Math.floor(diff / (60 * 1000)));
  return `${minutes}m`;
}

/** Returns the visual severity tier for UI components. */
export type SlaSeverity = "safe" | "warn" | "urgent" | "breached";

export function evaluateSlaSeverity(condition: SlaCondition, now: Date): SlaSeverity {
  const status = evaluateSlaStatus(condition, now);
  if (status === "satisfied") return "safe";
  if (status === "breached") return "breached";

  const due = Date.parse(condition.dueAt);
  const remainingMs = due - now.getTime();
  if (remainingMs <= MS_PER_DAY) return "urgent";
  if (remainingMs <= 7 * MS_PER_DAY) return "warn";
  return "safe";
}

export interface ConditionHealth {
  readonly pending: number;
  readonly breached: number;
  readonly satisfied: number;
}

export function summarizeConditions(
  conditions: readonly SlaCondition[],
  now: Date,
): ConditionHealth {
  let pending = 0;
  let breached = 0;
  let satisfied = 0;
  for (const c of conditions) {
    const s = evaluateSlaStatus(c, now);
    if (s === "satisfied") satisfied++;
    else if (s === "breached") breached++;
    else pending++;
  }
  return { pending, breached, satisfied };
}

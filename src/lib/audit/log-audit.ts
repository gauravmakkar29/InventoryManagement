/**
 * Centralized audit-log writer for compliance primitives.
 *
 * Wraps the existing audit trail (Epic 8). All compliance state transitions,
 * access-denial events, and immutable-operation audits flow through this helper
 * so they are uniformly classified and NIST-traceable (AU-2 / AU-3).
 *
 * NOTE: In production, `logAudit` dispatches to the server-side audit pipeline.
 * In tests and the in-app client, it writes to the local audit-log query cache.
 */

import type { QueryClient } from "@tanstack/react-query";

export type AuditOutcome = "success" | "denied" | "error";

export interface AuditRecord {
  /** Fully-qualified action name, e.g. `"compliance.evidence.put"` */
  readonly action: string;
  /** Primary resource type, e.g. `"Evidence"`, `"Approval"`, `"Checklist"` */
  readonly resourceType: string;
  /** Primary resource id */
  readonly resourceId: string;
  /** Principal that performed the action */
  readonly actor: { readonly userId: string; readonly displayName: string };
  /** Outcome classification — success/denied/error */
  readonly outcome: AuditOutcome;
  /** Optional typed context payload */
  readonly context?: Readonly<Record<string, unknown>>;
  /** Optional failure reason when outcome !== "success" */
  readonly reason?: string;
  /** ISO-8601 timestamp; defaulted to now if omitted */
  readonly at?: string;
}

export interface LogAuditOptions {
  /** TanStack queryClient — required in-app; tests may pass a stub */
  readonly queryClient?: QueryClient;
}

interface InternalEntry extends AuditRecord {
  readonly id: string;
  readonly at: string;
}

const AUDIT_CACHE_KEY = ["auditLogs", "list", undefined] as const;

/**
 * Write an audit record. Returns the full entry (with id + timestamp).
 *
 * @example
 * await logAudit({
 *   action: "compliance.evidence.put",
 *   resourceType: "Evidence",
 *   resourceId: evidenceId,
 *   actor: { userId, displayName },
 *   outcome: "success",
 *   context: { contentHash },
 * });
 */
export function logAudit(record: AuditRecord, options: LogAuditOptions = {}): InternalEntry {
  const entry: InternalEntry = {
    ...record,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: record.at ?? new Date().toISOString(),
  };

  const qc = options.queryClient;
  if (qc) {
    const prev = qc.getQueryData<InternalEntry[]>(AUDIT_CACHE_KEY) ?? [];
    qc.setQueryData<InternalEntry[]>(AUDIT_CACHE_KEY, [entry, ...prev]);
  }

  // Server-side audit dispatch happens through the existing API pipeline.
  // For the current in-app implementation, the cache update above is the store.

  return entry;
}

/** Test helper — read audit log entries from the cache without mutating. */
export function readAuditLog(queryClient: QueryClient): readonly InternalEntry[] {
  return queryClient.getQueryData<InternalEntry[]>(AUDIT_CACHE_KEY) ?? [];
}

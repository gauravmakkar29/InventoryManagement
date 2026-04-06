/**
 * AuditLog DTO → ViewModel mapper.
 *
 * Bridges canonical AuditLog (types.ts) and mock AuditEntry (deployment.ts).
 */

import type { AuditLog } from "../types";
import type { AuditEntry, AuditAction } from "../types/deployment";

/** API response → UI view model */
export function toAuditEntryViewModel(api: AuditLog): AuditEntry {
  return {
    id: api.id,
    timestamp: api.timestamp,
    user: api.userId,
    action: api.action as unknown as AuditAction,
    resourceType: api.resourceType,
    resourceId: api.resourceId,
    ipAddress: api.ipAddress,
    status: api.status,
  };
}

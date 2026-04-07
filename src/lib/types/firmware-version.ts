// =============================================================================
// Firmware Version Types — Story #388
// Immutable version records with point-in-time audit trail
// =============================================================================

import type { FirmwareLifecycleState } from "../types";

/** Event types that occur during a firmware version's lifecycle */
export type FirmwareVersionEventType =
  | "UPLOADED"
  | "SUBMITTED_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DEPLOYED"
  | "RECALLED"
  | "DEPRECATED"
  | "NOTE";

/** Immutable audit event for a firmware version (DynamoDB: SK = VER#<semver>#TS#<iso>) */
export interface FirmwareVersionEvent {
  id: string;
  type: FirmwareVersionEventType;
  actor: string;
  actorRole: string;
  timestamp: string; // ISO 8601
  description: string;
  metadata?: Record<string, string>;
}

/** Color category for timeline rendering per AC7 */
export type TimelineEventColor = "green" | "red" | "blue" | "gray";

/** Maps event types to timeline colors per story #388 AC7 */
export const EVENT_COLOR_MAP: Record<FirmwareVersionEventType, TimelineEventColor> = {
  UPLOADED: "blue",
  SUBMITTED_FOR_REVIEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
  DEPLOYED: "green",
  RECALLED: "red",
  DEPRECATED: "gray",
  NOTE: "gray",
};

/**
 * Firmware version — immutable snapshot.
 *
 * DynamoDB schema:
 *   PK: FIRMWARE#<familyId>
 *   SK: VER#<semver>#TS#<iso>
 */
export interface FirmwareVersion {
  id: string;
  familyId: string;
  version: string; // semver
  lifecycleState: FirmwareLifecycleState;
  releaseNotes: string;
  fileSize: number; // bytes
  checksum: string;
  compatibleModels: string[];
  sbomId?: string;
  hbomId?: string;
  uploadedBy: string;
  uploadedAt: string; // ISO 8601
  complianceStatus: "compliant" | "non-compliant" | "pending";
  deployedSiteCount: number;
  events: FirmwareVersionEvent[];
}

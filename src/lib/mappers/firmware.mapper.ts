/**
 * Firmware DTO ↔ ViewModel mapper.
 *
 * Bridges canonical Firmware and UI FirmwareEntry.
 */

import type { Firmware } from "../types";
import type { FirmwareEntry, FirmwareStage, FirmwareStatus } from "../types/deployment";

const STAGE_MAP: Record<string, FirmwareStage> = {
  uploaded: "Uploaded",
  testing: "Testing",
  approved: "Approved",
  rejected: "Approved", // no direct mapping
  deprecated: "Deprecated",
};

const STATUS_MAP: Record<string, FirmwareStatus> = {
  uploaded: "Pending",
  testing: "Pending",
  approved: "Active",
  deprecated: "Deprecated",
  rejected: "Deprecated",
};

/** API response → UI view model */
export function toFirmwareViewModel(api: Firmware): FirmwareEntry {
  return {
    id: api.id,
    version: api.version,
    name: api.name,
    stage: STAGE_MAP[api.approvalStage] ?? "Uploaded",
    status: STATUS_MAP[api.status] ?? "Pending",
    uploadedBy: api.uploadedBy,
    uploadedDate: api.uploadedAt,
    testedBy: null,
    testedDate: null,
    approvedBy: api.approvedBy ?? null,
    approvedDate: api.approvedAt ?? null,
    date: new Date(api.uploadedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    devices: api.deployedDeviceCount,
    models: api.compatibleModels,
    releaseNotes: api.releaseNotes,
    fileSize: formatBytes(api.fileSize),
    checksum: api.checksum,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import type { FirmwareAssignment } from "../types";

/**
 * Mock firmware assignments showing history across 3 devices.
 * Includes one assignment of a RECALLED firmware version (v2.0.1) for timeline display.
 *
 * @see Story 26.9 (#362) — FirmwareAssignment Entity
 * @see Story 26.11 (#364) — Device Firmware History Timeline
 */
export const MOCK_FIRMWARE_ASSIGNMENTS: FirmwareAssignment[] = [
  // --- Device 1: SG-3600-INV-001 (3 firmware changes) ---
  {
    id: "fa-001",
    deviceId: "dev-001",
    deviceName: "SG-3600-INV-001",
    firmwareId: "fw-001",
    firmwareVersion: "v4.1.0",
    firmwareName: "INV-3200 Controller",
    assignedBy: "u-mgr-01",
    assignedByEmail: "mgr.smith@example.com",
    assignedAt: "2026-04-04T09:30:00Z",
    assignmentMethod: "DOWNLOAD_TOKEN",
    previousFirmwareId: "fw-004",
    previousFirmwareVersion: "v4.0.2",
    downloadTokenId: "dt-001",
  },
  {
    id: "fa-002",
    deviceId: "dev-001",
    deviceName: "SG-3600-INV-001",
    firmwareId: "fw-004",
    firmwareVersion: "v4.0.2",
    firmwareName: "INV-3200 Controller",
    assignedBy: "u-tech-01",
    assignedByEmail: "tech.jones@example.com",
    assignedAt: "2026-03-15T14:00:00Z",
    assignmentMethod: "MANUAL",
    previousFirmwareId: "fw-005",
    previousFirmwareVersion: "v3.9.0",
  },
  {
    id: "fa-003",
    deviceId: "dev-001",
    deviceName: "SG-3600-INV-001",
    firmwareId: "fw-005",
    firmwareVersion: "v3.9.0",
    firmwareName: "INV-3200 Controller",
    assignedBy: "u-admin-01",
    assignedByEmail: "admin@hlm.com",
    assignedAt: "2026-01-20T10:00:00Z",
    assignmentMethod: "OTA",
  },

  // --- Device 2: SG-5000-COM-012 (3 firmware changes, includes RECALLED version) ---
  {
    id: "fa-004",
    deviceId: "dev-002",
    deviceName: "SG-5000-COM-012",
    firmwareId: "fw-002",
    firmwareVersion: "v3.8.2",
    firmwareName: "INV-3100 Gateway",
    assignedBy: "u-mgr-01",
    assignedByEmail: "mgr.smith@example.com",
    assignedAt: "2026-04-03T11:45:00Z",
    assignmentMethod: "DOWNLOAD_TOKEN",
    previousFirmwareId: "fw-006",
    previousFirmwareVersion: "v2.0.1",
    downloadTokenId: "dt-002",
  },
  {
    id: "fa-005",
    deviceId: "dev-002",
    deviceName: "SG-5000-COM-012",
    firmwareId: "fw-006",
    firmwareVersion: "v2.0.1",
    firmwareName: "SG-RT600 Router Module",
    assignedBy: "u-tech-02",
    assignedByEmail: "tech.garcia@example.com",
    assignedAt: "2026-02-10T08:30:00Z",
    assignmentMethod: "OTA",
    previousFirmwareId: "fw-007",
    previousFirmwareVersion: "v1.8.5",
  },
  {
    id: "fa-006",
    deviceId: "dev-002",
    deviceName: "SG-5000-COM-012",
    firmwareId: "fw-007",
    firmwareVersion: "v1.8.5",
    firmwareName: "SG-RT600 Router Module",
    assignedBy: "u-admin-01",
    assignedByEmail: "admin@hlm.com",
    assignedAt: "2025-11-05T16:00:00Z",
    assignmentMethod: "MANUAL",
  },

  // --- Device 3: SG-RT600-GW-007 (2 firmware changes) ---
  {
    id: "fa-007",
    deviceId: "dev-003",
    deviceName: "SG-RT600-GW-007",
    firmwareId: "fw-003",
    firmwareVersion: "v2.0.1",
    firmwareName: "SG-RT600 Router Module",
    assignedBy: "u-mgr-02",
    assignedByEmail: "mgr.chen@example.com",
    assignedAt: "2026-03-28T13:00:00Z",
    assignmentMethod: "DOWNLOAD_TOKEN",
    previousFirmwareId: "fw-008",
    previousFirmwareVersion: "v1.5.0",
    downloadTokenId: "dt-004",
  },
  {
    id: "fa-008",
    deviceId: "dev-003",
    deviceName: "SG-RT600-GW-007",
    firmwareId: "fw-008",
    firmwareVersion: "v1.5.0",
    firmwareName: "SG-RT600 Router Module",
    assignedBy: "u-tech-03",
    assignedByEmail: "tech.lee@example.com",
    assignedAt: "2025-09-12T09:15:00Z",
    assignmentMethod: "OTA",
  },

  // --- Rollback example (Story 27.4, #420) ---
  // Device 1 was briefly on v4.1.0 (fa-001 assigned 2026-04-04) but rolled back
  // to v4.0.2 the next day after a regression was observed in the field. The
  // `rollbackReason` field is required per Story 27.4 AC5.
  {
    id: "fa-009",
    deviceId: "dev-001",
    deviceName: "SG-3600-INV-001",
    firmwareId: "fw-004",
    firmwareVersion: "v4.0.2",
    firmwareName: "INV-3200 Controller",
    assignedBy: "u-admin-01",
    assignedByEmail: "admin@hlm.com",
    assignedAt: "2026-04-05T08:00:00Z",
    assignmentMethod: "MANUAL",
    previousFirmwareId: "fw-001",
    previousFirmwareVersion: "v4.1.0",
    rollbackReason:
      "v4.1.0 caused intermittent MPPT disconnections at Shanghai HQ under peak-load conditions. Rolling back to last known-good v4.0.2 while engineering prepares a hotfix. Ref: incident INC-2026-0405-001.",
  },
];

/**
 * Firmware IDs that have been RECALLED.
 * Used by the timeline component to flag entries with recalled versions.
 */
export const RECALLED_FIRMWARE_IDS: Set<string> = new Set(["fw-006"]);

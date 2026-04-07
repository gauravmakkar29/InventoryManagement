// =============================================================================
// Firmware Version Mock Data — Story #388
// 3 families × 3-4 versions with realistic lifecycle events
// =============================================================================

import { FirmwareLifecycleState } from "../types";
import type { FirmwareVersion, FirmwareVersionEvent } from "../types/firmware-version";

// ---------------------------------------------------------------------------
// Family: fam-1 — INV-3200 Power Controller Firmware
// ---------------------------------------------------------------------------

const FAM1_V1_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-101",
    type: "UPLOADED",
    actor: "eng.chen@example.com",
    actorRole: "Manager",
    timestamp: "2025-08-10T09:00:00Z",
    description: "Initial upload of v1.0.0 power controller firmware",
  },
  {
    id: "evt-102",
    type: "SUBMITTED_FOR_REVIEW",
    actor: "eng.chen@example.com",
    actorRole: "Manager",
    timestamp: "2025-08-10T09:30:00Z",
    description: "Submitted for Guidepoint compliance review",
  },
  {
    id: "evt-103",
    type: "APPROVED",
    actor: "compliance.team@guidepoint.com",
    actorRole: "Admin",
    timestamp: "2025-08-15T14:00:00Z",
    description: "Passed IEC 62443 compliance review",
    metadata: { reviewId: "GP-2025-1842", score: "94" },
  },
  {
    id: "evt-104",
    type: "DEPLOYED",
    actor: "ops.martinez@example.com",
    actorRole: "Manager",
    timestamp: "2025-08-20T10:00:00Z",
    description: "Deployed to Shanghai HQ (12 devices)",
    metadata: { siteCount: "1", deviceCount: "12" },
  },
];

const FAM1_V1_1_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-111",
    type: "UPLOADED",
    actor: "eng.chen@example.com",
    actorRole: "Manager",
    timestamp: "2025-10-01T08:00:00Z",
    description: "Upload v1.1.0 — improved thermal management",
  },
  {
    id: "evt-112",
    type: "SUBMITTED_FOR_REVIEW",
    actor: "eng.chen@example.com",
    actorRole: "Manager",
    timestamp: "2025-10-01T08:30:00Z",
    description: "Submitted for compliance review",
  },
  {
    id: "evt-113",
    type: "REJECTED",
    actor: "compliance.team@guidepoint.com",
    actorRole: "Admin",
    timestamp: "2025-10-08T16:00:00Z",
    description: "Failed — unsigned driver component detected",
    metadata: { reason: "Unsigned driver: pwr_ctrl_thermal.sys", reviewId: "GP-2025-2104" },
  },
];

const FAM1_V1_2_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-121",
    type: "UPLOADED",
    actor: "eng.chen@example.com",
    actorRole: "Manager",
    timestamp: "2025-10-15T09:00:00Z",
    description: "Upload v1.2.0 — signed driver fix for thermal management",
  },
  {
    id: "evt-122",
    type: "SUBMITTED_FOR_REVIEW",
    actor: "eng.chen@example.com",
    actorRole: "Manager",
    timestamp: "2025-10-15T09:15:00Z",
    description: "Re-submitted after signing fix",
  },
  {
    id: "evt-123",
    type: "APPROVED",
    actor: "compliance.team@guidepoint.com",
    actorRole: "Admin",
    timestamp: "2025-10-22T11:00:00Z",
    description: "Passed compliance review — all drivers signed",
    metadata: { reviewId: "GP-2025-2201", score: "97" },
  },
  {
    id: "evt-124",
    type: "DEPLOYED",
    actor: "ops.martinez@example.com",
    actorRole: "Manager",
    timestamp: "2025-11-01T08:00:00Z",
    description: "Rolled out to 3 sites (42 devices)",
    metadata: { siteCount: "3", deviceCount: "42" },
  },
];

// ---------------------------------------------------------------------------
// Family: fam-2 — INV-5000 Gateway Firmware
// ---------------------------------------------------------------------------

const FAM2_V2_0_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-201",
    type: "UPLOADED",
    actor: "dev.patel@example.com",
    actorRole: "Manager",
    timestamp: "2025-09-05T10:00:00Z",
    description: "Initial gateway firmware v2.0.0",
  },
  {
    id: "evt-202",
    type: "APPROVED",
    actor: "mgr.smith@example.com",
    actorRole: "Admin",
    timestamp: "2025-09-12T15:00:00Z",
    description: "Approved for staging",
  },
  {
    id: "evt-203",
    type: "DEPLOYED",
    actor: "ops.martinez@example.com",
    actorRole: "Manager",
    timestamp: "2025-09-20T09:00:00Z",
    description: "Deployed to Sydney DC (8 gateways)",
    metadata: { siteCount: "1", deviceCount: "8" },
  },
  {
    id: "evt-204",
    type: "DEPRECATED",
    actor: "mgr.smith@example.com",
    actorRole: "Admin",
    timestamp: "2026-01-15T12:00:00Z",
    description: "Deprecated — superseded by v2.1.0",
  },
];

const FAM2_V2_1_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-211",
    type: "UPLOADED",
    actor: "dev.patel@example.com",
    actorRole: "Manager",
    timestamp: "2025-12-10T10:00:00Z",
    description: "Upload v2.1.0 — TLS 1.3 support + connection pooling",
  },
  {
    id: "evt-212",
    type: "APPROVED",
    actor: "compliance.team@guidepoint.com",
    actorRole: "Admin",
    timestamp: "2025-12-18T14:00:00Z",
    description: "Passed security review with TLS 1.3 validation",
    metadata: { reviewId: "GP-2025-3401", score: "99" },
  },
  {
    id: "evt-213",
    type: "DEPLOYED",
    actor: "ops.davis@example.com",
    actorRole: "Manager",
    timestamp: "2026-01-10T08:00:00Z",
    description: "Deployed to 2 sites (15 gateways)",
    metadata: { siteCount: "2", deviceCount: "15" },
  },
];

const FAM2_V2_0_1_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-221",
    type: "UPLOADED",
    actor: "dev.patel@example.com",
    actorRole: "Manager",
    timestamp: "2026-02-20T08:00:00Z",
    description: "Hotfix v2.0.1 — CVE-2026-1234 patch",
  },
  {
    id: "evt-222",
    type: "APPROVED",
    actor: "mgr.smith@example.com",
    actorRole: "Admin",
    timestamp: "2026-02-21T10:00:00Z",
    description: "Emergency approval — critical CVE patch",
  },
  {
    id: "evt-223",
    type: "RECALLED",
    actor: "mgr.smith@example.com",
    actorRole: "Admin",
    timestamp: "2026-03-05T09:00:00Z",
    description: "Recalled — introduced memory leak in connection pool",
    metadata: { reason: "Memory leak in conn_pool.c causing OOM after 72h uptime" },
  },
];

// ---------------------------------------------------------------------------
// Family: fam-3 — INV-4000 Inverter Controller
// ---------------------------------------------------------------------------

const FAM3_V3_0_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-301",
    type: "UPLOADED",
    actor: "eng.kumar@example.com",
    actorRole: "Manager",
    timestamp: "2026-01-05T09:00:00Z",
    description: "Initial inverter controller firmware v3.0.0",
  },
  {
    id: "evt-302",
    type: "SUBMITTED_FOR_REVIEW",
    actor: "eng.kumar@example.com",
    actorRole: "Manager",
    timestamp: "2026-01-05T09:30:00Z",
    description: "Submitted for compliance review",
  },
  {
    id: "evt-303",
    type: "APPROVED",
    actor: "compliance.team@guidepoint.com",
    actorRole: "Admin",
    timestamp: "2026-01-14T11:00:00Z",
    description: "Passed IEC 62443 + NIST 800-53 review",
    metadata: { reviewId: "GP-2026-0102", score: "96" },
  },
  {
    id: "evt-304",
    type: "DEPLOYED",
    actor: "ops.martinez@example.com",
    actorRole: "Manager",
    timestamp: "2026-01-20T10:00:00Z",
    description: "Deployed to Brisbane plant (20 inverters)",
    metadata: { siteCount: "1", deviceCount: "20" },
  },
];

const FAM3_V3_1_EVENTS: FirmwareVersionEvent[] = [
  {
    id: "evt-311",
    type: "UPLOADED",
    actor: "eng.kumar@example.com",
    actorRole: "Manager",
    timestamp: "2026-03-15T08:00:00Z",
    description: "Upload v3.1.0 — MPPT optimization + grid sync improvements",
  },
  {
    id: "evt-312",
    type: "SUBMITTED_FOR_REVIEW",
    actor: "eng.kumar@example.com",
    actorRole: "Manager",
    timestamp: "2026-03-15T08:30:00Z",
    description: "Submitted for compliance review",
  },
  {
    id: "evt-313",
    type: "NOTE",
    actor: "compliance.team@guidepoint.com",
    actorRole: "Admin",
    timestamp: "2026-03-20T10:00:00Z",
    description: "Review in progress — awaiting lab test results for grid sync module",
  },
];

// ---------------------------------------------------------------------------
// Assembled mock data
// ---------------------------------------------------------------------------

export const MOCK_FIRMWARE_VERSIONS: Record<string, FirmwareVersion[]> = {
  "fam-1": [
    {
      id: "fwv-101",
      familyId: "fam-1",
      version: "1.0.0",
      lifecycleState: FirmwareLifecycleState.Active,
      releaseNotes: "Initial power controller firmware with thermal monitoring and MPPT control.",
      fileSize: 4_200_000,
      checksum: "sha256:a3f8c2d1e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9",
      compatibleModels: ["INV-3200"],
      sbomId: "sbom-101",
      uploadedBy: "eng.chen@example.com",
      uploadedAt: "2025-08-10T09:00:00Z",
      complianceStatus: "compliant",
      deployedSiteCount: 1,
      events: FAM1_V1_EVENTS,
    },
    {
      id: "fwv-102",
      familyId: "fam-1",
      version: "1.1.0",
      lifecycleState: FirmwareLifecycleState.Screening,
      releaseNotes: "Improved thermal management with adaptive fan curves.",
      fileSize: 4_350_000,
      checksum: "sha256:b4g9d3e2f5c6b7d8e9f0a1b2c3d4e5f6a7b8c900",
      compatibleModels: ["INV-3200"],
      uploadedBy: "eng.chen@example.com",
      uploadedAt: "2025-10-01T08:00:00Z",
      complianceStatus: "non-compliant",
      deployedSiteCount: 0,
      events: FAM1_V1_1_EVENTS,
    },
    {
      id: "fwv-103",
      familyId: "fam-1",
      version: "1.2.0",
      lifecycleState: FirmwareLifecycleState.Active,
      releaseNotes: "Signed driver fix for thermal management. All components code-signed.",
      fileSize: 4_380_000,
      checksum: "sha256:c5h0e4f3g6d7c8e9f0a1b2c3d4e5f6a7b8c9d0e1",
      compatibleModels: ["INV-3200"],
      sbomId: "sbom-103",
      hbomId: "hbom-103",
      uploadedBy: "eng.chen@example.com",
      uploadedAt: "2025-10-15T09:00:00Z",
      complianceStatus: "compliant",
      deployedSiteCount: 3,
      events: FAM1_V1_2_EVENTS,
    },
  ],
  "fam-2": [
    {
      id: "fwv-201",
      familyId: "fam-2",
      version: "2.0.0",
      lifecycleState: FirmwareLifecycleState.Deprecated,
      releaseNotes: "Initial gateway firmware with TLS 1.2 and basic routing.",
      fileSize: 8_100_000,
      checksum: "sha256:d6i1f5g4h7e8d9f0a1b2c3d4e5f6a7b8c9d0e1f2",
      compatibleModels: ["INV-5000"],
      sbomId: "sbom-201",
      uploadedBy: "dev.patel@example.com",
      uploadedAt: "2025-09-05T10:00:00Z",
      complianceStatus: "compliant",
      deployedSiteCount: 0,
      events: FAM2_V2_0_EVENTS,
    },
    {
      id: "fwv-202",
      familyId: "fam-2",
      version: "2.1.0",
      lifecycleState: FirmwareLifecycleState.Active,
      releaseNotes: "TLS 1.3 support, connection pooling, improved failover handling.",
      fileSize: 8_450_000,
      checksum: "sha256:e7j2g6h5i8f9e0a1b2c3d4e5f6a7b8c9d0e1f2g3",
      compatibleModels: ["INV-5000"],
      sbomId: "sbom-202",
      hbomId: "hbom-202",
      uploadedBy: "dev.patel@example.com",
      uploadedAt: "2025-12-10T10:00:00Z",
      complianceStatus: "compliant",
      deployedSiteCount: 2,
      events: FAM2_V2_1_EVENTS,
    },
    {
      id: "fwv-203",
      familyId: "fam-2",
      version: "2.0.1",
      lifecycleState: FirmwareLifecycleState.Recalled,
      releaseNotes: "Hotfix for CVE-2026-1234 — RECALLED due to memory leak.",
      fileSize: 8_120_000,
      checksum: "sha256:f8k3h7i6j9g0f1a2b3c4d5e6f7a8b9c0d1e2f3g4",
      compatibleModels: ["INV-5000"],
      uploadedBy: "dev.patel@example.com",
      uploadedAt: "2026-02-20T08:00:00Z",
      complianceStatus: "non-compliant",
      deployedSiteCount: 0,
      events: FAM2_V2_0_1_EVENTS,
    },
  ],
  "fam-3": [
    {
      id: "fwv-301",
      familyId: "fam-3",
      version: "3.0.0",
      lifecycleState: FirmwareLifecycleState.Active,
      releaseNotes: "Initial inverter controller with MPPT, grid sync, and fault detection.",
      fileSize: 6_700_000,
      checksum: "sha256:g9l4i8j7k0h1g2a3b4c5d6e7f8a9b0c1d2e3f4g5",
      compatibleModels: ["INV-4000"],
      sbomId: "sbom-301",
      uploadedBy: "eng.kumar@example.com",
      uploadedAt: "2026-01-05T09:00:00Z",
      complianceStatus: "compliant",
      deployedSiteCount: 1,
      events: FAM3_V3_0_EVENTS,
    },
    {
      id: "fwv-302",
      familyId: "fam-3",
      version: "3.1.0",
      lifecycleState: FirmwareLifecycleState.Screening,
      releaseNotes: "MPPT optimization + grid sync improvements. Pending compliance review.",
      fileSize: 6_850_000,
      checksum: "sha256:h0m5j9k8l1i2h3a4b5c6d7e8f9a0b1c2d3e4f5g6",
      compatibleModels: ["INV-4000"],
      uploadedBy: "eng.kumar@example.com",
      uploadedAt: "2026-03-15T08:00:00Z",
      complianceStatus: "pending",
      deployedSiteCount: 0,
      events: FAM3_V3_1_EVENTS,
    },
  ],
};

/** Flat array of all firmware versions for cross-referencing */
export const ALL_FIRMWARE_VERSIONS: FirmwareVersion[] =
  Object.values(MOCK_FIRMWARE_VERSIONS).flat();

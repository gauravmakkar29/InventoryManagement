import type { DownloadToken } from "../types";

/**
 * Mock download tokens in various lifecycle states.
 * @see Story 26.4 (#357) / Story 26.5 (#358)
 */
export const MOCK_DOWNLOAD_TOKENS: DownloadToken[] = [
  {
    id: "dt-001",
    tokenGuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    firmwareId: "fw-001",
    firmwareName: "INV-3200 Controller",
    firmwareVersion: "v4.1.0",
    userId: "u-tech-01",
    userEmail: "tech.jones@example.com",
    createdBy: "u-mgr-01",
    createdByEmail: "mgr.smith@example.com",
    createdAt: "2026-04-04T08:00:00Z",
    expiresAt: "2026-04-05T08:00:00Z",
    consumed: false,
    status: "active",
  },
  {
    id: "dt-002",
    tokenGuid: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    firmwareId: "fw-002",
    firmwareName: "INV-3100 Gateway",
    firmwareVersion: "v3.8.2",
    userId: "u-tech-02",
    userEmail: "tech.garcia@example.com",
    createdBy: "u-mgr-01",
    createdByEmail: "mgr.smith@example.com",
    createdAt: "2026-04-03T10:00:00Z",
    expiresAt: "2026-04-03T14:00:00Z",
    consumed: true,
    consumedAt: "2026-04-03T11:23:00Z",
    consumedIp: "203.0.113.42",
    status: "consumed",
  },
  {
    id: "dt-003",
    tokenGuid: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    firmwareId: "fw-001",
    firmwareName: "INV-3200 Controller",
    firmwareVersion: "v4.1.0",
    userId: "u-tech-03",
    userEmail: "tech.lee@example.com",
    createdBy: "u-mgr-02",
    createdByEmail: "mgr.chen@example.com",
    createdAt: "2026-04-01T09:00:00Z",
    expiresAt: "2026-04-01T13:00:00Z",
    consumed: false,
    status: "expired",
  },
  {
    id: "dt-004",
    tokenGuid: "d4e5f6a7-b8c9-0123-defa-234567890123",
    firmwareId: "fw-003",
    firmwareName: "SG-RT600 Router Module",
    firmwareVersion: "v2.0.1",
    userId: "u-tech-01",
    userEmail: "tech.jones@example.com",
    createdBy: "u-admin-01",
    createdByEmail: "admin@hlm.com",
    createdAt: "2026-04-04T06:00:00Z",
    expiresAt: "2026-04-11T06:00:00Z",
    consumed: false,
    status: "revoked",
  },
];

/** Mock firmware metadata for the download page (SI-7 integrity data). */
export const MOCK_FIRMWARE_METADATA: Record<string, { fileSize: number; sha256: string }> = {
  "fw-001": {
    fileSize: 48_300_032,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  "fw-002": {
    fileSize: 31_457_280,
    sha256: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
  },
  "fw-003": {
    fileSize: 12_582_912,
    sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  },
};

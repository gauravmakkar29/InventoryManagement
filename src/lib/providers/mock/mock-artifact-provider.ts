import type {
  IArtifactProvider,
  ArtifactUploadInput,
  ArtifactMetadata,
  ArtifactVersion,
  SecureLinkOptions,
  SecureLinkResult,
  WebhookConfig,
} from "../types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ARTIFACTS: ArtifactMetadata[] = [
  {
    id: "art-fw-001",
    name: "inverter-controller-fw",
    version: "3.2.1",
    checksum: "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    size: 4_521_984,
    contentType: "application/octet-stream",
    uploadedAt: "2026-03-15T10:30:00Z",
    uploadedBy: "admin@enterprise.com",
    storageUrl: "s3://ims-artifacts/firmware/inverter-controller-fw/3.2.1/firmware.bin",
    metadata: { deviceFamily: "SG-INV-3000", minHardwareRev: "2.0" },
  },
  {
    id: "art-fw-002",
    name: "gateway-mesh-fw",
    version: "1.8.0",
    checksum: "sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
    size: 2_097_152,
    contentType: "application/octet-stream",
    uploadedAt: "2026-03-20T14:15:00Z",
    uploadedBy: "firmware-eng@enterprise.com",
    storageUrl: "s3://ims-artifacts/firmware/gateway-mesh-fw/1.8.0/firmware.bin",
    metadata: { deviceFamily: "GW-MESH-100", protocol: "zigbee-3.0" },
  },
  {
    id: "art-fw-003",
    name: "sensor-array-fw",
    version: "2.4.3",
    checksum: "sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    size: 1_048_576,
    contentType: "application/octet-stream",
    uploadedAt: "2026-04-01T09:00:00Z",
    uploadedBy: "admin@enterprise.com",
    storageUrl: "s3://ims-artifacts/firmware/sensor-array-fw/2.4.3/firmware.bin",
    metadata: { deviceFamily: "SA-ENV-200", sensorTypes: "temp,humidity,pressure" },
  },
];

const MOCK_VERSIONS: Record<string, ArtifactVersion[]> = {
  "art-fw-001": [
    {
      version: "3.2.1",
      artifactId: "art-fw-001",
      changelog: "Fix inverter MPPT tracking under partial shade conditions",
      checksum: "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      size: 4_521_984,
      createdAt: "2026-03-15T10:30:00Z",
      createdBy: "admin@enterprise.com",
    },
    {
      version: "3.2.0",
      artifactId: "art-fw-001",
      changelog: "Add reactive power compensation support",
      checksum: "sha256:d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
      size: 4_490_240,
      createdAt: "2026-02-28T16:45:00Z",
      createdBy: "firmware-eng@enterprise.com",
    },
    {
      version: "3.1.0",
      artifactId: "art-fw-001",
      changelog: "Initial grid-tie compliance for IEEE 1547-2018",
      checksum: "sha256:e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
      size: 4_325_376,
      createdAt: "2026-01-10T08:00:00Z",
      createdBy: "admin@enterprise.com",
    },
  ],
  "art-fw-002": [
    {
      version: "1.8.0",
      artifactId: "art-fw-002",
      changelog: "Mesh network self-healing latency reduced to <500ms",
      checksum: "sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
      size: 2_097_152,
      createdAt: "2026-03-20T14:15:00Z",
      createdBy: "firmware-eng@enterprise.com",
    },
    {
      version: "1.7.2",
      artifactId: "art-fw-002",
      changelog: "Patch Zigbee 3.0 pairing timeout on high-density deployments",
      checksum: "sha256:f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
      size: 2_080_768,
      createdAt: "2026-03-05T11:30:00Z",
      createdBy: "admin@enterprise.com",
    },
  ],
  "art-fw-003": [
    {
      version: "2.4.3",
      artifactId: "art-fw-003",
      changelog: "Calibration drift compensation for humidity sensor",
      checksum: "sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      size: 1_048_576,
      createdAt: "2026-04-01T09:00:00Z",
      createdBy: "admin@enterprise.com",
    },
    {
      version: "2.4.2",
      artifactId: "art-fw-003",
      changelog: "Fix pressure sensor overflow at >1050 hPa",
      checksum: "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      size: 1_040_384,
      createdAt: "2026-03-18T13:00:00Z",
      createdBy: "firmware-eng@enterprise.com",
    },
    {
      version: "2.4.0",
      artifactId: "art-fw-003",
      changelog: "Add barometric pressure sensor support",
      checksum: "sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
      size: 1_024_000,
      createdAt: "2026-02-15T10:00:00Z",
      createdBy: "admin@enterprise.com",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let webhookCounter = 0;

/**
 * Generate a deterministic artifact ID from an upload input.
 *
 * @example
 * ```ts
 * generateArtifactId("inverter-fw", "4.0.0") // "art-inverter-fw-4.0.0"
 * ```
 */
function generateArtifactId(name: string, version: string): string {
  return `art-${name}-${version}`;
}

/**
 * Generate a mock SHA-256 checksum string.
 *
 * @example
 * ```ts
 * generateChecksum() // "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
 * ```
 */
function generateChecksum(): string {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    "",
  );
  return `sha256:${hex}`;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a mock artifact provider — self-contained mock implementations for
 * all 7 IArtifactProvider methods. Returns realistic firmware artifact data
 * for local development and testing.
 *
 * @example
 * ```ts
 * import { createMockArtifactProvider } from "./mock-artifact-provider";
 *
 * const artifact = createMockArtifactProvider();
 * const meta = await artifact.getArtifactMetadata("art-fw-001");
 * const versions = await artifact.listArtifactVersions("art-fw-001");
 * ```
 */
export function createMockArtifactProvider(): IArtifactProvider {
  return {
    // =========================================================================
    // Upload
    // =========================================================================

    /**
     * Upload a new artifact binary.
     *
     * @example
     * ```ts
     * const meta = await provider.uploadArtifact(
     *   { name: "inverter-fw", version: "4.0.0", contentType: "application/octet-stream" },
     *   new Blob(["binary-data"]),
     * );
     * ```
     */
    async uploadArtifact(
      input: ArtifactUploadInput,
      _file: File | Blob,
    ): Promise<ArtifactMetadata> {
      const id = generateArtifactId(input.name, input.version);
      return {
        id,
        name: input.name,
        version: input.version,
        checksum: input.checksum ?? generateChecksum(),
        size: _file.size,
        contentType: input.contentType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "mock-user@enterprise.com",
        storageUrl: `s3://ims-artifacts/firmware/${input.name}/${input.version}/firmware.bin`,
        metadata: input.metadata,
      };
    },

    // =========================================================================
    // Download
    // =========================================================================

    /**
     * Download an artifact binary by ID.
     *
     * @example
     * ```ts
     * const blob = await provider.downloadArtifact("art-fw-001");
     * ```
     */
    async downloadArtifact(_artifactId: string, _version?: string): Promise<Blob> {
      return new Blob(["mock-firmware-binary-content"], {
        type: "application/octet-stream",
      });
    },

    // =========================================================================
    // Metadata
    // =========================================================================

    /**
     * Retrieve metadata for a specific artifact.
     *
     * @example
     * ```ts
     * const meta = await provider.getArtifactMetadata("art-fw-001");
     * // meta?.name → "inverter-controller-fw"
     * ```
     */
    async getArtifactMetadata(artifactId: string): Promise<ArtifactMetadata | null> {
      return MOCK_ARTIFACTS.find((a) => a.id === artifactId) ?? null;
    },

    // =========================================================================
    // Versions
    // =========================================================================

    /**
     * List all versions of an artifact, ordered by creation date descending.
     *
     * @example
     * ```ts
     * const versions = await provider.listArtifactVersions("art-fw-001");
     * // versions.length → 3
     * ```
     */
    async listArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
      return MOCK_VERSIONS[artifactId] ?? [];
    },

    // =========================================================================
    // Secure Link
    // =========================================================================

    /**
     * Generate a secure, time-limited download link for an artifact.
     *
     * @example
     * ```ts
     * const link = await provider.generateSecureLink("art-fw-001", { expiresIn: 1800 });
     * // link.url → "https://artifacts.ims.enterprise.com/download/art-fw-001?token=..."
     * ```
     */
    async generateSecureLink(
      artifactId: string,
      _options?: SecureLinkOptions,
    ): Promise<SecureLinkResult> {
      const expiresIn = _options?.expiresIn ?? 3600;
      const maxUses = _options?.maxUses ?? 1;
      const token = `mock-token-${artifactId}-${Date.now()}`;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      return {
        url: `https://artifacts.ims.enterprise.com/download/${artifactId}?token=${token}`,
        token,
        expiresAt,
        maxUses,
      };
    },

    // =========================================================================
    // Webhook
    // =========================================================================

    /**
     * Register a webhook for artifact repository events.
     *
     * @example
     * ```ts
     * const result = await provider.registerWebhook({
     *   url: "https://hooks.enterprise.com/artifacts",
     *   events: ["artifact.uploaded", "artifact.deleted"],
     * });
     * // result.id → "wh-1"
     * ```
     */
    async registerWebhook(_config: WebhookConfig): Promise<{ id: string }> {
      webhookCounter += 1;
      return { id: `wh-${webhookCounter}` };
    },

    // =========================================================================
    // Delete
    // =========================================================================

    /**
     * Delete an artifact by ID.
     *
     * @example
     * ```ts
     * await provider.deleteArtifact("art-fw-001");
     * ```
     */
    async deleteArtifact(_artifactId: string): Promise<void> {
      // No-op in mock — real adapters would call the repository API
    },
  };
}

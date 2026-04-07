// =============================================================================
// Artifact Provider
// =============================================================================

/** Input for uploading a new artifact. */
export interface ArtifactUploadInput {
  name: string;
  version: string;
  contentType: string;
  checksum?: string;
  metadata?: Record<string, string>;
}

/** Metadata for a stored artifact. */
export interface ArtifactMetadata {
  id: string;
  name: string;
  version: string;
  checksum: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
  storageUrl: string;
  metadata?: Record<string, string>;
}

/** A single version entry in an artifact's history. */
export interface ArtifactVersion {
  version: string;
  artifactId: string;
  changelog: string;
  checksum: string;
  size: number;
  createdAt: string;
  createdBy: string;
}

/** Options for generating a time-limited secure download link. */
export interface SecureLinkOptions {
  /** Link validity in seconds (default: 3600). */
  expiresIn?: number;
  /** Maximum number of times the link can be used (default: 1). */
  maxUses?: number;
  /** Recipient email for verification code delivery. */
  recipientEmail?: string;
  /** Recipient phone for verification code delivery. */
  recipientPhone?: string;
  /** Require MFA step-up before download (default: true). */
  requireMFA?: boolean;
}

/** Result of generating a secure download link. */
export interface SecureLinkResult {
  url: string;
  token: string;
  expiresAt: string;
  maxUses: number;
}

/** Configuration for artifact repository webhooks. */
export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

/** Configuration for an artifact provider adapter. */
export interface ArtifactProviderConfig {
  /** Lambda endpoint URL for artifact operations. */
  readonly lambdaEndpoint: string;
  /** AWS region (optional, defaults to us-east-2). */
  readonly region?: string;
  /** Request timeout in ms (default: 30000). */
  readonly timeout?: number;
}

/**
 * Artifact provider interface — abstracts binary artifact storage.
 *
 * Adapters handle vendor-specific logic (JFrog, S3, Azure Blob, Nexus).
 * The app consumes this interface without knowing which repository is behind it.
 *
 * **Important:** This handles binary artifacts (firmware files).
 * Firmware metadata (name, status, approval stage) is managed by `IApiProvider`.
 */
export interface IArtifactProvider {
  /** Upload a new artifact binary. Returns metadata with generated ID and checksum. */
  uploadArtifact(input: ArtifactUploadInput, file: File | Blob): Promise<ArtifactMetadata>;

  /** Download an artifact binary by ID. Returns a Blob for client-side handling. */
  downloadArtifact(artifactId: string, version?: string): Promise<Blob>;

  /** Retrieve metadata for a specific artifact. */
  getArtifactMetadata(artifactId: string): Promise<ArtifactMetadata | null>;

  /** List all versions of an artifact, ordered by creation date descending. */
  listArtifactVersions(artifactId: string): Promise<ArtifactVersion[]>;

  /** Generate a secure, time-limited download link for an artifact. */
  generateSecureLink(artifactId: string, options?: SecureLinkOptions): Promise<SecureLinkResult>;

  /** Register a webhook for artifact repository events (e.g., new artifact deployed). */
  registerWebhook(config: WebhookConfig): Promise<{ id: string }>;

  /** Delete an artifact. Throws if artifact is locked (e.g., S3 Object Lock). */
  deleteArtifact(artifactId: string): Promise<void>;
}

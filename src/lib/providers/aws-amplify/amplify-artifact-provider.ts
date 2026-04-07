/**
 * S3 artifact adapter — template fallback for AWS-native deployments.
 *
 * Implements IArtifactProvider for Amazon S3. Each method delegates to
 * the Lambda proxy at `config.lambdaEndpoint/artifacts/*`. The proxy handles
 * S3 SDK calls, IAM authorization, and translates between IMS domain types
 * and S3 API responses.
 *
 * @see Story 20.2 (#384)
 */
import type {
  IArtifactProvider,
  ArtifactUploadInput,
  ArtifactMetadata,
  ArtifactVersion,
  SecureLinkOptions,
  SecureLinkResult,
  WebhookConfig,
  ArtifactProviderConfig,
} from "../types";

// =============================================================================
// Error classification
// =============================================================================

type ErrorKind = "not-found" | "auth" | "server" | "unknown";

function classifyStatus(status: number): ErrorKind {
  if (status === 404) return "not-found";
  if (status === 401 || status === 403) return "auth";
  if (status >= 500) return "server";
  return "unknown";
}

// =============================================================================
// Helpers
// =============================================================================

async function s3Fetch<T>(
  config: ArtifactProviderConfig,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${config.lambdaEndpoint}/artifacts${path}`;
  const timeout = config.timeout ?? 30_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown error");
      const kind = classifyStatus(response.status);
      throw new Error(
        `S3 artifact request failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function s3FetchBlob(config: ArtifactProviderConfig, path: string): Promise<Blob> {
  const url = `${config.lambdaEndpoint}/artifacts${path}`;
  const timeout = config.timeout ?? 30_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown error");
      const kind = classifyStatus(response.status);
      throw new Error(
        `S3 artifact download failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    return await response.blob();
  } finally {
    clearTimeout(timer);
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates an S3-backed artifact provider that delegates all operations
 * to a Lambda proxy endpoint. The proxy handles S3 SDK calls, bucket
 * policies, and translates between IMS domain types and S3 responses.
 *
 * @param config - Provider configuration with Lambda endpoint URL
 * @returns IArtifactProvider backed by Amazon S3
 *
 * @example
 * ```ts
 * const artifacts = createS3ArtifactProvider({
 *   lambdaEndpoint: "https://xyz.execute-api.us-east-1.amazonaws.com/prod",
 *   region: "us-east-2",
 *   timeout: 30000,
 * });
 * ```
 */
export function createS3ArtifactProvider(config: ArtifactProviderConfig): IArtifactProvider {
  return {
    // TODO: Validate against S3 PutObject response schema during integration testing
    async uploadArtifact(input: ArtifactUploadInput, file: File | Blob): Promise<ArtifactMetadata> {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("version", input.version);
      formData.append("contentType", input.contentType);
      if (input.checksum) formData.append("checksum", input.checksum);
      if (input.metadata) formData.append("metadata", JSON.stringify(input.metadata));
      formData.append("file", file);

      const url = `${config.lambdaEndpoint}/artifacts/upload`;
      const timeout = config.timeout ?? 30_000;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "Unknown error");
          const kind = classifyStatus(response.status);
          throw new Error(
            `S3 artifact upload failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
          );
        }

        return (await response.json()) as ArtifactMetadata;
      } finally {
        clearTimeout(timer);
      }
    },

    // TODO: Validate against S3 GetObject response during integration testing
    async downloadArtifact(artifactId: string, version?: string): Promise<Blob> {
      const params = version ? `?version=${encodeURIComponent(version)}` : "";
      return s3FetchBlob(config, `/download/${artifactId}${params}`);
    },

    // TODO: Validate against S3 HeadObject response during integration testing
    async getArtifactMetadata(artifactId: string): Promise<ArtifactMetadata | null> {
      try {
        return await s3Fetch<ArtifactMetadata>(config, `/metadata/${artifactId}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("[not-found]")) {
          return null;
        }
        throw error;
      }
    },

    // TODO: Validate against S3 ListObjectVersions response during integration testing
    async listArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
      return s3Fetch<ArtifactVersion[]>(config, `/versions/${artifactId}`);
    },

    /**
     * Request an S3 pre-signed URL from the Lambda proxy. The proxy generates
     * the URL using the AWS SDK `getSignedUrl` with configurable expiry.
     * Default expiry is controlled by `options.expiresIn` (seconds).
     */
    // TODO: Validate pre-signed URL format and expiry from S3 during integration testing
    async generateSecureLink(
      artifactId: string,
      options?: SecureLinkOptions,
    ): Promise<SecureLinkResult> {
      return s3Fetch<SecureLinkResult>(config, `/secure-link/${artifactId}`, {
        method: "POST",
        body: JSON.stringify({
          expiresIn: options?.expiresIn ?? 3600,
          maxUses: options?.maxUses,
          recipientEmail: options?.recipientEmail,
          recipientPhone: options?.recipientPhone,
          requireMFA: options?.requireMFA,
        }),
      });
    },

    /**
     * Configure an S3 Event Notification via the Lambda proxy. The proxy
     * creates or updates the bucket notification configuration to POST to
     * the specified webhook URL on the given events.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html
     */
    // TODO: Validate S3 Event Notification configuration response during integration testing
    async registerWebhook(webhookConfig: WebhookConfig): Promise<{ id: string }> {
      return s3Fetch<{ id: string }>(config, "/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url: webhookConfig.url,
          events: webhookConfig.events,
          secret: webhookConfig.secret,
        }),
      });
    },

    /**
     * Delete an artifact from S3.
     *
     * NOTE: S3 buckets with Object Lock (Governance or Compliance mode)
     * will reject delete requests for locked objects. The Lambda proxy
     * returns 403 in that case. Callers should check lock status before
     * attempting deletion if Object Lock is enabled on the bucket.
     */
    // TODO: Handle S3 Object Lock 403 distinctly from IAM 403
    async deleteArtifact(artifactId: string): Promise<void> {
      await s3Fetch<void>(config, `/${artifactId}`, {
        method: "DELETE",
      });
    },
  };
}

/**
 * JFrog Artifactory adapter — PoC default for Sungrow. All calls routed through Lambda.
 *
 * Implements IArtifactProvider for JFrog Artifactory. Each method delegates to
 * the Lambda proxy at `config.lambdaEndpoint/artifacts/*`. Error responses are
 * parsed and classified so callers get actionable failure reasons.
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

async function jfrogFetch<T>(
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
        `JFrog artifact request failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function jfrogFetchBlob(config: ArtifactProviderConfig, path: string): Promise<Blob> {
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
        `JFrog artifact download failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
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
 * Creates a JFrog Artifactory artifact provider that delegates all operations
 * to a Lambda proxy endpoint. The proxy handles JFrog API authentication and
 * translates between IMS domain types and JFrog REST responses.
 *
 * @param config - Provider configuration with Lambda endpoint URL
 * @returns IArtifactProvider backed by JFrog Artifactory
 *
 * @example
 * ```ts
 * const artifacts = createJFrogArtifactProvider({
 *   lambdaEndpoint: "https://xyz.execute-api.us-east-1.amazonaws.com/prod",
 *   timeout: 30000,
 * });
 * ```
 */
export function createJFrogArtifactProvider(config: ArtifactProviderConfig): IArtifactProvider {
  return {
    // TODO: Validate against JFrog AQL response schema when integration testing begins
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
            `JFrog artifact upload failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
          );
        }

        return (await response.json()) as ArtifactMetadata;
      } finally {
        clearTimeout(timer);
      }
    },

    // TODO: Validate against JFrog download response when integration testing begins
    async downloadArtifact(artifactId: string, version?: string): Promise<Blob> {
      const params = version ? `?version=${encodeURIComponent(version)}` : "";
      return jfrogFetchBlob(config, `/download/${artifactId}${params}`);
    },

    // TODO: Validate against JFrog file-info response when integration testing begins
    async getArtifactMetadata(artifactId: string): Promise<ArtifactMetadata | null> {
      try {
        return await jfrogFetch<ArtifactMetadata>(config, `/metadata/${artifactId}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("[not-found]")) {
          return null;
        }
        throw error;
      }
    },

    // TODO: Validate against JFrog AQL version listing when integration testing begins
    async listArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
      return jfrogFetch<ArtifactVersion[]>(config, `/versions/${artifactId}`);
    },

    /**
     * Request a pre-signed URL from the Lambda proxy. The proxy generates the
     * signed URL on the JFrog side and returns it to the client.
     */
    // TODO: Validate pre-signed URL format and expiry from JFrog when integration testing begins
    async generateSecureLink(
      artifactId: string,
      options?: SecureLinkOptions,
    ): Promise<SecureLinkResult> {
      return jfrogFetch<SecureLinkResult>(config, `/secure-link/${artifactId}`, {
        method: "POST",
        body: JSON.stringify(options ?? {}),
      });
    },

    /**
     * Register a webhook for JFrog repository events. The payload follows the
     * JFrog webhook format (repository, artifact, event type).
     *
     * @see https://jfrog.com/help/r/jfrog-platform-administration/configuring-webhooks
     */
    // TODO: Validate webhook registration response when integration testing begins
    async registerWebhook(webhookConfig: WebhookConfig): Promise<{ id: string }> {
      return jfrogFetch<{ id: string }>(config, "/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url: webhookConfig.url,
          events: webhookConfig.events,
          secret: webhookConfig.secret,
          // JFrog-specific: webhook payload format
          format: "default",
        }),
      });
    },

    /**
     * Delete an artifact from JFrog Artifactory.
     *
     * NOTE: JFrog repositories with immutable policies (e.g., release-local
     * with "Block Deletion" enabled) will reject delete requests. The Lambda
     * proxy returns 403 in that case, which is classified as an auth error.
     */
    // TODO: Handle JFrog immutable-policy 403 distinctly from auth 403
    async deleteArtifact(artifactId: string): Promise<void> {
      await jfrogFetch<void>(config, `/${artifactId}`, {
        method: "DELETE",
      });
    },
  };
}

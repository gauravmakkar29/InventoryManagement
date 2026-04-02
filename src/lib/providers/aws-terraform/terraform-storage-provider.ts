/**
 * IMS Gen 2 — AWS Terraform Storage Provider
 *
 * Key-value storage abstraction backed by browser localStorage.
 * When VITE_STORAGE_ENDPOINT is set (pointing to a Terraform-provisioned S3
 * bucket via API Gateway or CloudFront presigned URLs), file upload operations
 * can use it for firmware binaries and compliance documents.
 *
 * The IStorageProvider interface is for simple key-value persistence (settings,
 * preferences, cached data) — not for large file uploads. File uploads go
 * through the API provider's uploadFirmware / submitComplianceReview methods.
 *
 * Required env vars (from Terraform outputs — see Docs/integration-contract.md):
 *   VITE_STORAGE_ENDPOINT — S3 presigned URL endpoint (optional, for file uploads)
 *
 * @see Story #207 — Terraform adapter package
 */

import type { IStorageProvider } from "../types";

// =============================================================================
// Config
// =============================================================================

interface TerraformStorageConfig {
  /** S3 presigned URL endpoint for file uploads (optional) */
  storageEndpoint: string | null;
}

function loadStorageConfig(): TerraformStorageConfig {
  const storageEndpoint = import.meta.env.VITE_STORAGE_ENDPOINT ?? null;
  return { storageEndpoint };
}

// =============================================================================
// Provider implementation
// =============================================================================

/**
 * Create a Terraform storage provider.
 *
 * For key-value persistence, delegates to browser localStorage (same as mock).
 * The storage endpoint config is captured here so that future file upload
 * features can reference it without re-reading env vars.
 */
export function createTerraformStorageProvider(): IStorageProvider {
  const config = loadStorageConfig();

  if (config.storageEndpoint) {
    // Log availability for debugging — file uploads route through API provider
    console.warn(
      `[Terraform Storage] S3 endpoint configured: ${config.storageEndpoint}. ` +
        `File uploads are handled by the API provider.`,
    );
  }

  return {
    getItem(key: string): string | null {
      return localStorage.getItem(key);
    },

    setItem(key: string, value: string): void {
      localStorage.setItem(key, value);
    },

    removeItem(key: string): void {
      localStorage.removeItem(key);
    },
  };
}

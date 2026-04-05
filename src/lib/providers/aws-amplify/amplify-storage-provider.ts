/**
 * IMS Gen 2 — AWS Amplify Gen2 Storage Provider
 *
 * S3-based storage via presigned URLs for file uploads (firmware binaries,
 * compliance documents, audit exports). Uses the same S3 presigned URL
 * pattern regardless of whether the bucket was provisioned by Amplify Gen2,
 * CDK, or Terraform.
 *
 * For key-value persistence (IStorageProvider), delegates to localStorage
 * since the interface is designed for client-side state. S3 file operations
 * are exposed as additional methods for future use.
 *
 * Required env vars (from amplify_outputs.json):
 *   VITE_STORAGE_ENDPOINT — S3 presigned URL endpoint (storage.bucket_name region)
 *
 * @see Story #204 — AWS Amplify Gen2 adapter package
 */

import type { IStorageProvider } from "../types";

// =============================================================================
// Config
// =============================================================================

interface AmplifyStorageConfig {
  /** S3 presigned URL endpoint (optional — file uploads disabled without it) */
  storageEndpoint: string | null;
  /** AWS region for S3 operations */
  region: string;
}

function loadStorageConfig(): AmplifyStorageConfig {
  const storageEndpoint = import.meta.env.VITE_STORAGE_ENDPOINT ?? null;
  const region = import.meta.env.VITE_AUTH_REGION ?? "ap-southeast-2";

  return { storageEndpoint, region };
}

// =============================================================================
// S3 presigned URL helpers (for future file upload features)
// =============================================================================

/**
 * Upload a file to S3 via a presigned URL.
 * Routes through resilient-fetch for timeout handling.
 * @see Story 22.2 — NIST SC-8 (transmission integrity)
 */
export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const { resilientS3Upload } = await import("../../resilient-fetch");
  return resilientS3Upload(presignedUrl, file);
}

/**
 * Download a file from S3 via a presigned URL.
 * Routes through resilient-fetch for timeout handling.
 * @see Story 22.2 — NIST SC-8 (transmission integrity)
 */
export async function downloadFromS3(presignedUrl: string): Promise<Blob> {
  const { resilientS3Download } = await import("../../resilient-fetch");
  return resilientS3Download(presignedUrl);
}

/**
 * Request a presigned URL from the backend API.
 * Routes through api-client for retry, backoff, and circuit breaker.
 * @see Story 22.2 — NIST SC-8 (transmission integrity)
 */
export async function getPresignedUrl(
  storageEndpoint: string,
  key: string,
  operation: "GET" | "PUT",
  authToken?: string,
): Promise<string> {
  const { resilientGetPresignedUrl } = await import("../../resilient-fetch");
  return resilientGetPresignedUrl(storageEndpoint, key, operation, authToken);
}

// =============================================================================
// Storage Provider (IStorageProvider — client-side key-value)
// =============================================================================

/**
 * Create an Amplify Gen2 storage provider.
 *
 * The IStorageProvider interface is for client-side key-value persistence
 * (localStorage). S3 file operations are available via the exported helper
 * functions above.
 */
export function createAmplifyStorageProvider(): IStorageProvider {
  // Load config to validate env vars at startup (warn if missing)
  const config = loadStorageConfig();

  if (!config.storageEndpoint) {
    console.warn(
      "[Amplify Storage] VITE_STORAGE_ENDPOINT not set — file uploads will be unavailable. " +
        "This value comes from amplify_outputs.json (storage.bucket_name).",
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

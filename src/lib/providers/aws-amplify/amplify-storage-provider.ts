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

/** Upload a file to S3 via a presigned URL. */
export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
  }
}

/** Download a file from S3 via a presigned URL. */
export async function downloadFromS3(presignedUrl: string): Promise<Blob> {
  const response = await fetch(presignedUrl);

  if (!response.ok) {
    throw new Error(`S3 download failed: ${response.status} ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Request a presigned URL from the backend API.
 * The backend generates presigned URLs to avoid exposing AWS credentials.
 */
export async function getPresignedUrl(
  storageEndpoint: string,
  key: string,
  operation: "GET" | "PUT",
  authToken?: string,
): Promise<string> {
  const response = await fetch(`${storageEndpoint}/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ key, operation }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.status}`);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
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

import type { PlatformConfig, PlatformId } from "./types";
import { createMockApiProvider } from "./mock/mock-api-provider";
import { createMockStorageProvider } from "./mock/mock-storage-provider";
import { MockAuthProvider } from "./mock/mock-auth-provider";

/**
 * Detect which platform to use based on VITE_PLATFORM env var.
 * Defaults to "mock" for local development.
 */
function detectPlatform(): PlatformId {
  const platform = import.meta.env.VITE_PLATFORM as PlatformId | undefined;
  return platform ?? "mock";
}

/**
 * Create platform config with the appropriate adapters.
 * Add new cases here as cloud adapters are implemented.
 *
 * @see Story #204 — AWS Amplify Gen2 adapter
 * @see Story #205 — AWS CDK adapter
 * @see Story #206 — Azure adapter
 * @see Story #207 — Terraform adapter
 */
export function createPlatformConfig(): PlatformConfig {
  const platform = detectPlatform();

  switch (platform) {
    case "aws-amplify":
      throw new Error(`Platform "${platform}" is not yet implemented. See Story #204.`);
    case "aws-cdk":
      throw new Error(`Platform "${platform}" is not yet implemented. See Story #205.`);
    case "aws-terraform":
      throw new Error(`Platform "${platform}" is not yet implemented. See Story #207.`);
    case "azure":
      throw new Error(`Platform "${platform}" is not yet implemented. See Story #206.`);
    case "mock":
    default:
      return {
        api: createMockApiProvider(),
        storage: createMockStorageProvider(),
        AuthProvider: MockAuthProvider,
      };
  }
}

import type { PlatformConfig, PlatformId } from "./types";
import { createMockApiProvider } from "./mock/mock-api-provider";
import { createMockStorageProvider } from "./mock/mock-storage-provider";
import { MockAuthProvider } from "./mock/mock-auth-provider";

const VALID_PLATFORMS: PlatformId[] = ["mock", "aws-amplify", "aws-cdk", "aws-terraform", "azure"];

/**
 * Detect and validate the platform from VITE_PLATFORM env var.
 * Fails fast with a clear error if the value is invalid.
 */
function detectPlatform(): PlatformId {
  const raw = import.meta.env.VITE_PLATFORM as string | undefined;
  const platform = (raw ?? "mock") as PlatformId;

  if (!VALID_PLATFORMS.includes(platform)) {
    throw new Error(
      `Invalid VITE_PLATFORM="${raw}". ` + `Valid values: ${VALID_PLATFORMS.join(", ")}`,
    );
  }

  return platform;
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

import type { PlatformConfig, PlatformId } from "./types";
import { createMockApiProvider } from "./mock/mock-api-provider";
import { createMockStorageProvider } from "./mock/mock-storage-provider";
import { MockAuthProvider } from "./mock/mock-auth-provider";
import { createMockArtifactProvider } from "./mock/mock-artifact-provider";
import { createMockCRMProvider } from "./mock/mock-crm-provider";
import { createMockScannerProvider } from "./mock/mock-scanner-provider";
import { createMockCDCProvider } from "./mock/mock-cdc-provider";
import { createMockDNSProvider } from "./mock/mock-dns-provider";
import { createAuthProvider } from "./auth-provider";
import { createCdkAuthAdapter } from "./aws-cdk/cdk-auth-adapter";
import { createCdkApiProvider } from "./aws-cdk/cdk-api-provider";
import { createAmplifyAuthAdapter } from "./aws-amplify/amplify-auth-adapter";
import { createAmplifyApiProvider } from "./aws-amplify/amplify-api-provider";
import { createAmplifyStorageProvider } from "./aws-amplify/amplify-storage-provider";
// Concrete provider adapters — uncomment when wiring non-mock platforms:
// import { createJFrogArtifactProvider } from "./jfrog/jfrog-artifact-provider";
// import { createS3ArtifactProvider } from "./aws-amplify/amplify-artifact-provider";
// import { createServiceNowCRMProvider } from "./servicenow/servicenow-crm-provider";
import { createTerraformAuthAdapter } from "./aws-terraform/terraform-auth-adapter";
import { createTerraformApiProvider } from "./aws-terraform/terraform-api-provider";
import { createTerraformStorageProvider } from "./aws-terraform/terraform-storage-provider";

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
 * Validate required env vars for non-mock platforms.
 * Fails fast with actionable error messages instead of failing silently at runtime.
 *
 * @see Docs/integration-contract.md for the full env var specification.
 * @see Story #231 — Integration contract
 */
function validateEnvVars(platform: PlatformId): void {
  if (platform === "mock") return;

  const required: Array<{ key: string; description: string }> = [
    { key: "VITE_AUTH_PROVIDER_URL", description: "Auth issuer URL (Cognito/Entra ID/Auth0)" },
    { key: "VITE_AUTH_CLIENT_ID", description: "OAuth 2.0 SPA client ID" },
    {
      key: "VITE_API_ENDPOINT",
      description: "Backend API base URL (AppSync/API Gateway/Azure Functions)",
    },
  ];

  const missing = required.filter(({ key }) => !import.meta.env[key]);

  if (missing.length > 0) {
    const details = missing.map(({ key, description }) => `  - ${key}: ${description}`).join("\n");
    throw new Error(
      `Platform "${platform}" requires these env vars:\n${details}\n\n` +
        `Set them in .env or your deployment config. See Docs/integration-contract.md.`,
    );
  }

  // Warn about optional vars that enable additional features
  const optional: Array<{ key: string; feature: string }> = [
    { key: "VITE_STORAGE_ENDPOINT", feature: "File uploads (firmware, compliance docs)" },
    { key: "VITE_SEARCH_ENDPOINT", feature: "Full-text and geo search" },
    { key: "VITE_REALTIME_ENDPOINT", feature: "Real-time device status updates" },
  ];

  for (const { key, feature } of optional) {
    if (!import.meta.env[key]) {
      console.warn(`[IMS] ${key} not set — ${feature} will be unavailable.`);
    }
  }
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
  validateEnvVars(platform);

  switch (platform) {
    case "aws-amplify":
      return {
        api: createAmplifyApiProvider(),
        storage: createAmplifyStorageProvider(),
        AuthProvider: createAuthProvider(createAmplifyAuthAdapter()),
        // Artifact: wire S3 adapter when VITE_ARTIFACT_ENDPOINT is configured:
        // artifact: createS3ArtifactProvider({ lambdaEndpoint: import.meta.env.VITE_ARTIFACT_ENDPOINT }),
        // CRM: wire ServiceNow adapter when VITE_CRM_ENDPOINT is configured:
        // crm: createServiceNowCRMProvider({ lambdaEndpoint: import.meta.env.VITE_CRM_ENDPOINT }),
        // JFrog alternative (Sungrow PoC):
        // artifact: createJFrogArtifactProvider({ lambdaEndpoint: import.meta.env.VITE_ARTIFACT_ENDPOINT }),
      };
    case "aws-cdk":
      return {
        api: createCdkApiProvider(),
        storage: createMockStorageProvider(), // TODO: S3 storage adapter
        AuthProvider: createAuthProvider(createCdkAuthAdapter()),
      };
    case "aws-terraform":
      return {
        api: createTerraformApiProvider(),
        storage: createTerraformStorageProvider(),
        AuthProvider: createAuthProvider(createTerraformAuthAdapter()),
      };
    case "azure":
      throw new Error(`Platform "${platform}" is not yet implemented. See Story #206.`);
    case "mock":
    default:
      return {
        api: createMockApiProvider(),
        storage: createMockStorageProvider(),
        AuthProvider: MockAuthProvider,
        artifact: createMockArtifactProvider(),
        crm: createMockCRMProvider(),
        complianceScanner: createMockScannerProvider(),
        cdc: createMockCDCProvider(),
        dns: createMockDNSProvider({ provider: "mock", domain: "localhost" }),
      };
  }
}

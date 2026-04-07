# Epic 20 — Tech Spec: Pluggable External Integrations

## Provider Architecture

Extends the existing provider/adapter pattern in `src/lib/providers/`.

**CRITICAL:** All new code must match the enterprise quality of the existing providers. See [epic-20-overview.md](./epic-20-overview.md#enterprise-standards) for the full checklist.

### New Provider Interfaces

```
src/lib/providers/types.ts          ← Add IArtifactProvider, ICRMProvider,
                                       IComplianceScannerProvider, ICDCProvider, IDNSProvider
```

### New Adapters (file layout)

```
src/lib/providers/
├── mock/
│   ├── mock-artifact-provider.ts       ← Story 20.1
│   ├── mock-crm-provider.ts            ← Story 20.3
│   ├── mock-scanner-provider.ts        ← Story 20.5
│   └── mock-cdc-provider.ts            ← Story 20.8
├── jfrog/
│   └── jfrog-artifact-provider.ts      ← Story 20.2
├── servicenow/
│   ├── servicenow-crm-provider.ts      ← Story 20.4
│   └── servicenow-field-map.ts         ← Field mapping utility
├── ignite/
│   └── ignite-scanner-provider.ts      ← Story 20.5
├── azure/
│   └── azure-dns-provider.ts           ← Story 20.10
└── aws-amplify/
    ├── amplify-artifact-provider.ts    ← Story 20.2 (S3 adapter)
    ├── amplify-dns-provider.ts         ← Story 20.10 (Route 53 adapter)
    └── amplify-cdc-provider.ts         ← Story 20.8
```

### New Hooks

```
src/lib/hooks/
├── use-artifact.ts                     ← Story 20.1
├── use-crm.ts                          ← Story 20.3
├── use-compliance-scanner.ts           ← Story 20.5
└── use-cdc-events.ts                   ← Story 20.8
```

### New Components

```
src/app/components/
├── firmware/
│   ├── firmware-detail-page.tsx            ← Story 20.6
│   ├── firmware-version-timeline.tsx       ← Story 20.6
│   ├── firmware-version-selector.tsx       ← Story 20.6
│   ├── generate-download-link-modal.tsx    ← Story 20.9
│   ├── secure-download-page.tsx            ← Story 20.9
│   └── active-links-table.tsx              ← Story 20.9
└── customers/
    ├── customer-list-page.tsx              ← Story 20.7
    ├── customer-detail-page.tsx            ← Story 20.7
    ├── site-card.tsx                       ← Story 20.7
    └── site-deployment-timeline.tsx        ← Story 20.7
```

## PlatformConfig Extension

```typescript
export interface PlatformConfig {
  api: IApiProvider;
  storage: IStorageProvider;
  AuthProvider: ComponentType<{ children: ReactNode }>;
  // NEW — Epic 20
  artifact: IArtifactProvider;
  crm: ICRMProvider;
  complianceScanner: IComplianceScannerProvider;
  cdc: ICDCProvider;
  dns: IDNSProvider;
}
```

## Factory & Registry Pattern (MUST follow)

Every adapter exports a **factory function**, not a class:

```typescript
// ✅ Correct — factory function
export function createJFrogArtifactProvider(config: ArtifactProviderConfig): IArtifactProvider { ... }
export function createS3ArtifactProvider(config: ArtifactProviderConfig): IArtifactProvider { ... }

// ❌ Wrong — never export classes directly
export class JFrogArtifactProvider implements IArtifactProvider { ... }
```

### platform.config.ts Wiring

```typescript
case "jfrog":
  return {
    ...baseConfig,
    artifact: createJFrogArtifactProvider({ lambdaEndpoint: import.meta.env.VITE_ARTIFACT_ENDPOINT }),
    crm: createServiceNowCRMProvider({ lambdaEndpoint: import.meta.env.VITE_CRM_ENDPOINT }),
    complianceScanner: createIgniteScannerProvider({ lambdaEndpoint: import.meta.env.VITE_SCANNER_ENDPOINT }),
    cdc: createDDBStreamsCDCProvider({ realtimeEndpoint: import.meta.env.VITE_REALTIME_ENDPOINT }),
    dns: createAzureDNSProvider({ domain: import.meta.env.VITE_DNS_DOMAIN }),
  };
```

### Env Var Validation

New required env vars for non-mock platforms:

```typescript
{ key: "VITE_ARTIFACT_ENDPOINT", description: "Artifact provider Lambda endpoint (JFrog/S3)" },
{ key: "VITE_CRM_ENDPOINT", description: "CRM provider Lambda endpoint (ServiceNow)" },
{ key: "VITE_SCANNER_ENDPOINT", description: "Compliance scanner Lambda endpoint (Ignite)" },
{ key: "VITE_DNS_DOMAIN", description: "Primary domain for DNS provider (e.g., sungrow.com)" },
```

### ProviderRegistry Extension

```typescript
interface ProviderRegistryValue {
  api: IApiProvider;
  storage: IStorageProvider;
  artifact: IArtifactProvider; // NEW
  crm: ICRMProvider; // NEW
  complianceScanner: IComplianceScannerProvider; // NEW
  cdc: ICDCProvider; // NEW
  dns: IDNSProvider; // NEW
}
```

### Consumer Hooks (all with context guard)

```typescript
export function useArtifactProvider(): IArtifactProvider {
  return useProviders().artifact;
}
// Same pattern for useCRMProvider, useComplianceScannerProvider, useCDCProvider, useDNSProvider
```

```

## DynamoDB Schema Additions

### Firmware Family & Version

| PK | SK | Entity |
|----|-----|--------|
| `FIRMWARE#<familyId>` | `META` | FirmwareFamily metadata |
| `FIRMWARE#<familyId>` | `VER#<semver>#TS#<iso>` | FirmwareVersion snapshot |
| `FIRMWARE#<familyId>` | `DEPLOY#<siteId>#TS#<iso>` | SiteDeployment record |

### Customer & Site

| PK | SK | Entity |
|----|-----|--------|
| `CUSTOMER#<customerId>` | `META` | Customer metadata |
| `CUSTOMER#<customerId>` | `SITE#<siteId>` | Site record |
| `SITE#<siteId>` | `DEPLOY#<firmwareVersionId>` | Active deployment |

### Secure Links

| PK | SK | Entity |
|----|-----|--------|
| `SECLINK#<token>` | `META` | SecureLink metadata (expiry, status, recipient) |

### GSI Patterns

- **GSI1:** `entityType` + `createdAt` — list all firmware families, all customers
- **GSI2:** `firmwareVersionId` + `siteId` — "which sites run this version?"
- **GSI3:** `customerId` + `deployedAt` — "deployment history for this customer"

## Data Flow: Artifact Upload (JFrog)

```

1. User clicks "Upload Firmware" in UI
2. uploadFirmware() → IApiProvider (creates metadata in DynamoDB)
3. uploadArtifact() → IArtifactProvider → JFrogArtifactProvider
4. JFrog adapter POSTs to Lambda endpoint
5. Lambda uploads binary to JFrog via REST API (credentials from Secrets Manager)
6. Lambda returns artifact URL + checksum
7. DDB Streams fires → Audit Lambda writes CDC event
8. UI receives confirmation, timeline updates

```

## Data Flow: Secure Download

```

1. Manager clicks "Generate Download Link"
2. MFA step-up via Cognito
3. generateSecureLink() → IArtifactProvider (creates pre-signed URL)
4. Lambda creates token in DynamoDB (SECLINK#<token>)
5. Manager sends link to field tech
6. Field tech opens /download/<token> → verification page
7. Enters 6-digit code (sent via SNS)
8. verifySecureLink() → Lambda validates token + code
9. On success: redirect to pre-signed download URL, mark link as used
10. CDC event logged for audit

```

## Integration Pattern: Lambda-Mediated

All external system calls follow this pattern:

```

Browser → Adapter → Lambda API Gateway Endpoint → Lambda Function → External API
↓
Secrets Manager (credentials)

```

This ensures:
- No external API credentials in the browser
- Centralized rate limiting and circuit breaking
- Audit trail at the Lambda layer
- VPC/NAT gateway can be added later if needed (Abdul: "don't add yet until there's a blocker")
```

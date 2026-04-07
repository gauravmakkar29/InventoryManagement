# Epic 20 — Pluggable External Integrations & Firmware Lifecycle

## Vision

Extend the IMS Gen2 provider/adapter architecture to support **external system integrations** as swappable providers. Any organization adopting this template can plug in their own artifact repository (JFrog, S3, Nexus, Azure Blob), CRM/ticketing system (ServiceNow, Jira, Salesforce), or compliance scanner (Ignite, Qualys, Tenable) — without changing a single line of business logic.

## Business Context

Sungrow's PoC requires connectivity to JFrog Artifactory, Sungrow Ignite, and ServiceNow. However, this platform is designed as a **reusable enterprise template**. All external integrations must be coded against provider interfaces, with concrete adapters per vendor.

### PoC Defaults vs Template Alternatives

| Concern                | PoC (Sungrow)                       | Template Alternative    |
| ---------------------- | ----------------------------------- | ----------------------- |
| **Artifact Source**    | JFrog Artifactory (Docker webhook)  | S3 (Event Notification) |
| **DNS**                | Azure DNS (client owns sungrow.com) | AWS Route 53            |
| **CRM/Ticketing**      | ServiceNow                          | Jira, Salesforce        |
| **Compliance Scanner** | Sungrow Ignite (access pending)     | Qualys, Tenable, Snyk   |

All are one-line swaps in `platform.config.ts`. No business logic changes.

## Architecture Principles

1. **Interface-first** — Define `IArtifactProvider`, `ICRMProvider`, `IComplianceScannerProvider`, `IDNSProvider` before any adapter
2. **Adapter pattern** — Each vendor is one adapter file implementing the interface
3. **Mock-first development** — Every provider ships with a mock adapter for local dev/testing
4. **Registry-driven** — Adapters are registered in `platform.config.ts`, same as existing `IApiProvider` / `IAuthAdapter`
5. **Lambda-mediated** — All external calls route through Lambda (REST outbound) per architecture decision

## Enterprise Standards (MUST match existing codebase quality)

Every new provider and adapter MUST follow the patterns already established in the codebase:

| Standard                                      | Reference Implementation                                         | Applies To                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Factory functions** (`createXxxProvider()`) | `createMockApiProvider()`, `createAmplifyAuthAdapter()`          | All new adapters — never export classes directly                                                 |
| **JSDoc with @example**                       | `IAuthAdapter` in `auth-adapter.ts`                              | All interface methods — every method has a JSDoc + usage example                                 |
| **Env var validation**                        | `validateEnvVars()` in `platform.config.ts`                      | New adapters requiring config (Lambda endpoints, API keys) must fail fast with actionable errors |
| **Module-level singleton**                    | `setApiProvider()` / `getApiProvider()` in `registry.tsx`        | New providers that need non-React access must use the same pattern                               |
| **ProviderRegistry wiring**                   | `ProviderRegistryProps` + `ProviderRegistryContext`              | New providers must be added to the registry context, not consumed via ad-hoc imports             |
| **Consumer hooks with guard**                 | `useApiProvider()` throws if called outside `<ProviderRegistry>` | Every new `useXxx()` hook must include the context guard                                         |
| **Error classification**                      | Existing `ApiError` pattern in API providers                     | All adapter errors mapped to a typed error hierarchy (network, auth, not-found, server, timeout) |
| **TanStack Query integration**                | Existing query patterns with `queryClient`                       | Hooks use `useQuery` / `useMutation` with proper cache keys, stale times, and invalidation       |
| **Platform switch-case**                      | `createPlatformConfig()` switch block                            | New adapters added as cases; unimplemented platforms throw with story reference                  |
| **Readonly config properties**                | `refreshIntervalMs`, `refreshThresholdMs` in `IAuthAdapter`      | Provider config constants are `readonly` — no runtime mutation                                   |
| **NIST compliance**                           | AU-2/AU-3 audit logging, AC-3 access enforcement                 | Every external call must be auditable; every provider operation must respect RBAC                |

## Provider Matrix

| Provider Interface           | Mock Adapter |    PoC Adapter    | Template Alternative |
| ---------------------------- | :----------: | :---------------: | :------------------: |
| `IArtifactProvider`          |     20.1     |   JFrog (20.2)    |      S3 (20.2)       |
| `ICRMProvider`               |     20.3     | ServiceNow (20.4) |          —           |
| `IComplianceScannerProvider` |     20.5     |   Ignite (20.5)   |          —           |
| `IDNSProvider`               |    20.10     | Azure DNS (20.10) |   Route 53 (20.10)   |

## Stories

| Story | Title                                                        | Phase                  | Points | Priority |
| ----- | ------------------------------------------------------------ | ---------------------- | ------ | -------- |
| 20.1  | Artifact Provider Interface + Mock Adapter                   | 1 — Interfaces         | 5      | P0       |
| 20.2  | JFrog & S3 Artifact Adapters                                 | 1 — Interfaces         | 8      | P0       |
| 20.3  | CRM/Ticketing Provider Interface + Mock Adapter              | 1 — Interfaces         | 5      | P1       |
| 20.4  | ServiceNow CRM Adapter                                       | 1 — Interfaces         | 5      | P1       |
| 20.5  | Compliance Scanner Provider Interface + Ignite/Mock Adapters | 1 — Interfaces         | 5      | P1       |
| 20.6  | Firmware Version History & Point-in-Time Timeline            | 2 — Firmware Lifecycle | 8      | P0       |
| 20.7  | Customer & Site Entity Model + Firmware Association          | 2 — Domain Model       | 8      | P0       |
| 20.8  | CDC Event Provider Interface + DDB Streams Adapter           | 3 — Observability      | 5      | P1       |
| 20.9  | Secure One-Time Firmware Download Link                       | 3 — Security           | 5      | P1       |
| 20.10 | DNS Provider Interface + Azure DNS / Route 53 Adapters       | 1 — Interfaces         | 5      | P0       |

## Dependencies

- **Epic 19** (P0 stories) — Auth provider, API client, session management must be stable
- **Epic 4** — Firmware entity model already exists; 20.6 extends it with versioning
- **Epic 8** — Audit trail infrastructure; 20.8 formalizes CDC as a provider

## Delivery Timeline

- **Week 2 (Discovery):** Stories 20.1, 20.2, 20.10 — prove JFrog connectivity via Lambda + Azure DNS → CloudFront routing
- **Week 2-3:** Stories 20.6, 20.7 — firmware versioning + customer/site for demo
- **Week 3:** Stories 20.3-20.5 — CRM and compliance scanner providers
- **Week 4:** Stories 20.8, 20.9 — CDC streaming + secure download

# ADR-006: API Versioning Strategy

**Status:** Accepted
**Date:** 2026-04-01

## Context

IMS Gen2 is designed as a cloud-agnostic template. Different backend providers (AppSync, REST APIs, Azure Functions) may version their APIs differently. The frontend needs a consistent way to:

1. Declare which API version it expects
2. Detect when the server version has changed
3. Degrade gracefully when endpoints are deprecated

Without a strategy, version mismatches cause silent failures or breaking changes that are difficult to diagnose.

## Decision

Support **two versioning modes**, configurable per provider adapter:

### 1. Header-Based (Default)

Every request includes `X-API-Version: {version}` header. The server echoes back its version in the response. This is the recommended approach for GraphQL APIs (AppSync) where the URL is fixed.

### 2. Path-Based

The URL is prefixed with `/v{N}/` (e.g., `/v1/devices`, `/v2/devices`). This is the standard REST convention and is preferred for traditional REST APIs.

### Version Mismatch Detection

On every response, the client checks the server's `X-API-Version` header. If it differs from the client's expected version, a warning is surfaced via configurable callback. This can:

- Show a toast: "A newer API version is available. Please refresh."
- Log to monitoring (Sentry, CloudWatch)
- Set a `deprecated` flag for UI indicators

### Graceful Degradation

When a mismatch is detected, the client continues operating on its current version. No automatic upgrade or redirect. The user can refresh at their convenience. This prevents mid-session disruption.

## Implementation

```
src/lib/api-version.ts
  ├── createApiVersionManager(config) → IApiVersionManager
  ├── createVersionInterceptor(manager) → request interceptor
  └── createVersionCheckInterceptor(manager) → response interceptor
```

The interceptors plug into `createApiClient()` from `src/lib/api-client.ts`. Each provider adapter configures its own versioning mode:

```typescript
const versionManager = createApiVersionManager({
  version: "1",
  mode: "header", // or "path" for REST APIs
  onVersionMismatch: (client, server) => {
    toast.info(`API updated to v${server}. Refresh for latest features.`);
  },
});

const client = createApiClient({
  requestInterceptors: [createVersionInterceptor(versionManager)],
  responseInterceptors: [createVersionCheckInterceptor(versionManager)],
});
```

## Alternatives Considered

| Alternative                                               | Why Rejected                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| **Query parameter** (`?v=1`)                              | Pollutes cache keys, not standard for GraphQL                     |
| **Accept header** (`Accept: application/vnd.ims.v1+json`) | Over-engineered for our use case, poor tooling support            |
| **No versioning**                                         | Unacceptable for enterprise — breaking changes must be detectable |
| **Auto-upgrade on mismatch**                              | Risky — could break mid-session forms or workflows                |

## Consequences

- **Positive:** Consistent versioning across all provider adapters. Mismatch detection prevents silent failures. Template adopters get versioning out of the box.
- **Positive:** Both GraphQL (header) and REST (path) patterns supported.
- **Negative:** Requires server cooperation — backend must echo `X-API-Version` header for mismatch detection to work. Without it, detection is a no-op (safe fallback).

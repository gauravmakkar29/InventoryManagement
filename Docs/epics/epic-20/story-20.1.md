# Story 20.1: Artifact Provider Interface + Mock Adapter

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 1: PROVIDER INTERFACES
**Persona:** Prince (Lead Developer) / Template Consumer
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** #383
**Target URL:** N/A (library layer — no UI)

## User Story

As a platform developer, I want a pluggable `IArtifactProvider` interface with a mock adapter, so that any artifact repository (JFrog, S3, Nexus, Azure Blob) can be integrated without changing business logic.

## Preconditions

- Provider registry (`src/lib/providers/registry.tsx`) is functional
- `PlatformConfig` in `src/lib/providers/types.ts` exists
- Existing provider pattern (IApiProvider, IAuthAdapter, IStorageProvider) is the reference implementation

## Context / Business Rules

- **Pluggable template rule:** The interface must NOT reference any vendor-specific types (no JFrog SDK types, no AWS S3 types). All vendor specifics live in adapters only.
- **Lambda-mediated:** In production, all artifact operations route through Lambda endpoints. The interface abstracts this — mock adapter returns local data, real adapters call Lambda.
- **Firmware binary ≠ firmware metadata:** `IApiProvider.uploadFirmware()` handles metadata (DynamoDB). `IArtifactProvider` handles the binary artifact (JFrog/S3/Blob).
- **Webhook support:** The interface must support a webhook registration method for push-based artifact notifications (JFrog webhook, S3 event notification, etc.).

## Acceptance Criteria

- [ ] AC1: `IArtifactProvider` interface is defined in `src/lib/providers/types.ts` with methods: `uploadArtifact`, `downloadArtifact`, `getArtifactMetadata`, `listArtifactVersions`, `generateSecureLink`, `registerWebhook`, `deleteArtifact`
- [ ] AC2: All methods use generic types — `ArtifactUploadInput`, `ArtifactMetadata`, `ArtifactVersion`, `SecureLinkOptions`, `WebhookConfig` — defined in the same types file
- [ ] AC3: `MockArtifactProvider` is implemented in `src/lib/providers/mock/mock-artifact-provider.ts` returning realistic mock data (firmware binaries, checksums, version lists)
- [ ] AC4: `PlatformConfig` is extended with an `artifact: IArtifactProvider` field
- [ ] AC5: Provider registry wires mock adapter by default in development
- [ ] AC6: Unit tests cover all mock adapter methods with ≥ 85% coverage
- [ ] AC7: A `useArtifact()` hook is created in `src/lib/hooks/` that consumes the provider from registry context

## Out of Scope

- JFrog or S3 concrete adapters (Story 20.2)
- UI for artifact upload/download (existing firmware upload modal uses this under the hood)
- Lambda function implementation (infra layer)

## Dev Checklist (NOT for QA)

1. Add `IArtifactProvider` + types to `src/lib/providers/types.ts`
2. Create `src/lib/providers/mock/mock-artifact-provider.ts`
3. Extend `PlatformConfig` with `artifact` field
4. Update provider registry to accept and distribute artifact provider
5. Create `src/lib/hooks/use-artifact.ts` wrapping TanStack Query
6. Wire mock adapter in `platform.config.ts` for `mock` platform
7. Write unit tests in `src/__tests__/providers/artifact-provider.test.ts`

## AutoGent Test Prompts

1. **AC1-AC2 — Interface contract:** "Import IArtifactProvider from types.ts. Verify it has exactly 7 methods. Verify ArtifactMetadata has fields: id, name, version, checksum, size, contentType, uploadedAt, uploadedBy. Verify ArtifactVersion has fields: version, artifactId, changelog, createdAt."

2. **AC3 — Mock adapter:** "Create a MockArtifactProvider instance. Call uploadArtifact with a test payload. Verify it returns an ArtifactMetadata object with a generated ID and checksum. Call listArtifactVersions for that artifact and verify the uploaded version appears."

3. **AC4-AC5 — Registry wiring:** "Import the platform config for 'mock' platform. Verify config.artifact is an instance of MockArtifactProvider. Call config.artifact.getArtifactMetadata with a known mock ID and verify it returns data."

4. **AC7 — Hook integration:** "Render a test component using useArtifact hook inside ProviderRegistry. Call the hook's uploadArtifact mutation. Verify loading states transition correctly and the result matches mock data."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No vendor-specific imports in interface file
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

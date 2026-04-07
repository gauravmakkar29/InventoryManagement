# Story 20.2: JFrog & S3 Artifact Adapters

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 1: PROVIDER INTERFACES
**Persona:** Prince (Lead Developer) / Justin (DevOps)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** #384
**Target URL:** N/A (library layer — no UI)

## User Story

As a platform developer, I want concrete JFrog Artifactory and S3 adapters implementing `IArtifactProvider`, so that the PoC can pull Docker artifacts from JFrog via webhook and the template also supports S3 as an alternative artifact source.

## Preconditions

- Story 20.1 is complete — `IArtifactProvider` interface and mock adapter exist
- Lambda endpoints for artifact operations are defined (can be mocked initially)
- JFrog Docker container is available for local testing (Abdul's requirement)

## Context / Business Rules

- **JFrog flow (PoC):** Webhook fires on new artifact → Lambda receives event → stores metadata in DynamoDB → frontend polls/subscribes for updates. Download is pull-only via pre-signed URL or JFrog API token.
- **S3 flow (template alternative):** S3 Event Notification → Lambda → DynamoDB. Download via pre-signed URL.
- **Both adapters call Lambda** — they do NOT call JFrog/S3 directly from the browser. The adapter formats the request and calls the Lambda API endpoint.
- **Secrets Management:** API keys and tokens are stored in AWS Secrets Manager. Adapters receive only the Lambda endpoint URL, never raw credentials.
- **Adapter selection:** Configured in `platform.config.ts` — one line change to swap JFrog for S3.

## Acceptance Criteria

- [ ] AC1: `JFrogArtifactProvider` is implemented in `src/lib/providers/jfrog/jfrog-artifact-provider.ts` implementing all `IArtifactProvider` methods
- [ ] AC2: `S3ArtifactProvider` is implemented in `src/lib/providers/aws-amplify/amplify-artifact-provider.ts` (or `aws-terraform/`) implementing all `IArtifactProvider` methods
- [ ] AC3: Both adapters accept a configuration object: `{ lambdaEndpoint: string, region?: string, timeout?: number }`
- [ ] AC4: `JFrogArtifactProvider.registerWebhook()` creates a JFrog webhook config payload and POSTs it to the Lambda endpoint
- [ ] AC5: `S3ArtifactProvider.generateSecureLink()` requests a pre-signed URL from Lambda with configurable expiry (default 1 hour)
- [ ] AC6: Both adapters implement proper error classification (network, auth, not-found, server) using existing `ApiError` patterns
- [ ] AC7: `platform.config.ts` is updated with a `jfrog` and `aws-amplify` artifact provider wiring (JFrog as default for PoC)
- [ ] AC8: Unit tests for both adapters with ≥ 85% coverage, using MSW to mock Lambda endpoints

## Out of Scope

- Lambda function implementation (infra layer — Epic 17)
- JFrog Docker container setup (Justin's DevOps task)
- Nexus, Azure Blob, or other artifact adapters (future stories)
- UI changes (existing firmware upload modal consumes `useArtifact` hook from 20.1)

## Dev Checklist (NOT for QA)

1. Create `src/lib/providers/jfrog/jfrog-artifact-provider.ts`
2. Create S3 artifact provider in appropriate cloud adapter folder
3. Define shared config type `ArtifactProviderConfig` in types
4. Implement all 7 `IArtifactProvider` methods per adapter
5. Add error mapping to existing `ApiError` classification
6. Update `platform.config.ts` — add artifact provider wiring for each platform
7. Write MSW handlers for Lambda artifact endpoints
8. Write unit tests for both adapters

## AutoGent Test Prompts

1. **AC1-AC3 — JFrog adapter instantiation:** "Create a JFrogArtifactProvider with config { lambdaEndpoint: 'https://test.execute-api.us-east-2.amazonaws.com/artifact' }. Verify it implements IArtifactProvider. Call getArtifactMetadata('fw-001') and verify the request is sent to the correct Lambda endpoint with JFrog-specific headers."

2. **AC4 — Webhook registration:** "Call JFrogArtifactProvider.registerWebhook({ url: 'https://hook.example.com', events: ['artifact.deployed'] }). Verify the Lambda endpoint receives a POST with JFrog webhook payload format."

3. **AC5 — S3 pre-signed URL:** "Create an S3ArtifactProvider. Call generateSecureLink('fw-001', { expiresIn: 3600 }). Verify the response contains a URL with signature parameters and the correct expiry."

4. **AC6 — Error classification:** "Mock Lambda to return 404. Call JFrogArtifactProvider.getArtifactMetadata('nonexistent'). Verify it throws an ApiError with classification 'not-found'. Mock Lambda to return 401. Verify classification is 'auth'."

5. **AC7 — Platform config swap:** "Import platform config for 'jfrog'. Verify config.artifact is JFrogArtifactProvider. Switch to 'aws-amplify'. Verify config.artifact is S3ArtifactProvider. Both should implement the same IArtifactProvider interface."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No direct JFrog SDK or AWS SDK imports — all calls go through Lambda endpoint
- [ ] Both adapters pass same interface compliance test suite
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

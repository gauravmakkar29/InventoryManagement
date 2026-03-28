# Story 17.8: OpenSearch Infrastructure & OSIS Pipeline

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Engineer, I want to provision the OpenSearch Serverless collection, security policies, data access policies, and the OSIS ingestion pipeline via Terraform, so that DynamoDB data is automatically synced to OpenSearch for full-text search and aggregation capabilities.

## Acceptance Criteria
- [ ] AC1: When I apply the `opensearch` module in production, an OpenSearch Serverless collection named "ims-gen2-search" is created with search type
- [ ] AC2: When I apply the module, encryption, network, and data access security policies are created granting access to both the OSIS pipeline role and the AppSync role
- [ ] AC3: When I apply the module, an OSIS pipeline is created that reads from DynamoDB Streams and writes to the OpenSearch collection
- [ ] AC4: When I apply the module in dev/staging (`opensearch_type = "managed"`), a managed OpenSearch domain is created instead of a serverless collection (for cost savings)
- [ ] AC5: When the OSIS pipeline is running and a new device is created in DynamoDB, the device record appears in the OpenSearch index within 60 seconds
- [ ] AC6: When I apply the module, an AppSync HTTP data source is created pointing to the OpenSearch collection endpoint with IAM signing (service: "aoss")
- [ ] AC7: When I apply the module, all 4 search resolvers are deployed on the HTTP data source: searchGlobal, searchDevices, searchVulnerabilities, getAggregations
- [ ] AC8: When I apply the module, an S3 export bucket is created for the initial DynamoDB data load into OpenSearch

## UI Behavior
- N/A (infrastructure-only story)

## Out of Scope
- OpenSearch index mapping configuration (managed by OSIS pipeline template)
- Search result ranking tuning
- OpenSearch dashboard (Kibana equivalent) access

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for all OpenSearch resources (#22-#30), OSIS pipeline IAM role, and environment-specific OpenSearch type.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

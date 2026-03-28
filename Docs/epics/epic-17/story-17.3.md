# Story 17.3: AppSync GraphQL API & Resolvers

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Engineer, I want to provision the AppSync GraphQL API with its schema, DynamoDB data source, and all 11 JavaScript resolvers via Terraform, so that the frontend can query and mutate data through a fully functional API layer.

## Acceptance Criteria
- [ ] AC1: When I apply the `appsync` module, an AppSync GraphQL API is created with Cognito User Pool authorization
- [ ] AC2: When I apply the module, the GraphQL schema includes all 24 queries and 9 mutations defined in the project brief (Section 6.1, 6.2)
- [ ] AC3: When I apply the module, a DynamoDB data source is configured connecting AppSync to the DataTable with the appropriate IAM role
- [ ] AC4: When I apply the module, all 11 DynamoDB JavaScript resolvers are deployed: getEntity, listByGSI1, queryByGSI2, queryByGSI3, queryByGSI4, queryByPK, createEntity, updateStatus, approveFirmware, advanceFirmwareStage, updateVulnerabilityStatus
- [ ] AC5: When I invoke the `listDevices` query via the AppSync console with valid Cognito credentials, it returns device records from DynamoDB
- [ ] AC6: When I invoke the `approveFirmware` mutation where the approver is the same as the uploader, the resolver returns a Separation of Duties error
- [ ] AC7: When I update a resolver's JavaScript source file and re-apply, only the changed resolver is updated (no unnecessary resource recreation)

## UI Behavior
- N/A (infrastructure-only story)

## Out of Scope
- OpenSearch data source and search resolvers (Story 17.6 / Epic 18)
- Frontend integration testing
- AppSync subscriptions (real-time)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for AppSync module structure, resolver file listing, and IAM role for AppSync.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

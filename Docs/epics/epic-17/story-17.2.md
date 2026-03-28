# Story 17.2: DynamoDB, Cognito & IAM Modules

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Engineer, I want to provision the DynamoDB single-table, Cognito user pool with RBAC groups, and IAM roles with least-privilege policies via Terraform, so that the platform has its core data store, authentication, and security foundation in place.

## Acceptance Criteria
- [ ] AC1: When I apply the `dynamodb` module, a single DynamoDB table is created with: PAY_PER_REQUEST billing, 4 GSIs (GSI1-GSI4), DynamoDB Streams (NEW_AND_OLD_IMAGES), KMS encryption, and a TTL attribute on `ttl`
- [ ] AC2: When I apply with `enable_pitr = true` (staging/prod), Point-in-Time Recovery is enabled on the table
- [ ] AC3: When I apply the `cognito` module, a User Pool is created with: 12-character minimum password (upper/lower/number/symbol), optional TOTP MFA, custom attributes (role, department, customerId), and email recovery
- [ ] AC4: When I apply the `cognito` module, a User Pool Client is created with token expiry settings matching the environment (60 min dev / 15 min staging+prod)
- [ ] AC5: When I apply the `cognito` module, 5 user groups are created: Admin, Manager, Technician, Viewer, CustomerAdmin
- [ ] AC6: When I apply the `iam` module, IAM roles are created for AppSync, Lambda, OSIS, and CloudFront with policies scoped to only the resources they need (no wildcard resource ARNs)
- [ ] AC7: When I run `terraform plan` after initial apply with no changes, the plan shows "No changes. Your infrastructure matches the configuration."

## UI Behavior
- N/A (infrastructure-only story)

## Out of Scope
- AppSync API (Story 17.3)
- S3 buckets (Story 17.4)
- Seeding the database with test data
- Creating actual Cognito users

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for DynamoDB table configuration (Section 4.3), Cognito configuration (Section 5.1), and IAM role definitions.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

# Story 17.1: Terraform Foundation & State Backend

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Engineer, I want to set up the Terraform project structure with remote state storage and locking, so that the team can safely collaborate on infrastructure changes without state conflicts.

## Acceptance Criteria
- [ ] AC1: When I run `terraform init` in the `infra/` directory, it initializes successfully with the S3 backend and DynamoDB lock table
- [ ] AC2: When I run `terraform validate`, the root module and all child modules pass validation with zero errors
- [ ] AC3: When I run `terraform fmt -check -recursive`, all `.tf` files are properly formatted
- [ ] AC4: When I specify `-var-file="environments/dev.tfvars"`, Terraform uses dev-specific configuration values
- [ ] AC5: When two engineers run `terraform plan` simultaneously, the DynamoDB lock table prevents concurrent state modifications
- [ ] AC6: When I inspect `outputs.tf`, key resource identifiers (API endpoint, CloudFront URL, Cognito user pool ID, DynamoDB table name) are exported for downstream use

## UI Behavior
- N/A (infrastructure-only story)

## Out of Scope
- Provisioning any AWS services (just the project skeleton and state backend)
- CI/CD pipeline setup (Story 17.7)
- Environment-specific resource differences (Stories 17.2-17.6 handle individual modules)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for module structure, variables.tf definitions, and backend configuration.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

# Story 17.7: CI/CD Pipeline & Environment Promotion

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Engineer, I want GitHub Actions workflows that automatically validate Terraform on pull requests and deploy infrastructure on merge, so that infrastructure changes are reviewed, tested, and promoted through environments (dev -> staging -> prod) with confidence.

## Acceptance Criteria
- [ ] AC1: When I open a pull request targeting the `dev`, `staging`, or `main` branch, a CI workflow automatically runs: `terraform fmt -check`, `terraform validate`, `terraform plan`, `npm test`, and `npm run compliance:validate`
- [ ] AC2: When the CI workflow completes the Terraform plan, the plan output is posted as a comment on the pull request for review
- [ ] AC3: When a pull request is merged to the `dev` branch, the deploy workflow automatically runs `terraform apply` with `dev.tfvars`, builds the frontend, syncs to S3, and invalidates CloudFront cache
- [ ] AC4: When a pull request is merged to the `staging` branch, the deploy workflow applies with `staging.tfvars` and deploys the frontend to the staging environment
- [ ] AC5: When a release tag (`v*`) is pushed to `main`, the deploy workflow applies with `prod.tfvars` and deploys to production
- [ ] AC6: When any CI check fails (lint, test, compliance), the pull request is blocked from merging (enforced by branch protection rules)
- [ ] AC7: When I view the GitHub Actions workflow run, all secrets (AWS credentials, Cognito IDs) are masked and not visible in logs
- [ ] AC8: When a Terraform apply fails mid-execution, the state is consistent (no partial applies that leave orphaned resources)

## UI Behavior
- N/A (CI/CD pipeline — viewed in GitHub Actions UI)

## Out of Scope
- Blue/green deployment strategy
- Canary deployments
- Rollback automation (manual Terraform revert via PR)
- Multi-region deployment

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for CI/CD pipeline YAML definitions, environment-to-branch mapping, and deploy trigger strategy.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

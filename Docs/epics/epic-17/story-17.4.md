# Story 17.4: S3 Buckets, CloudFront & Lambda

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Engineer, I want to provision the S3 firmware bucket (with WORM protection), the S3 frontend hosting bucket, the CloudFront CDN distribution, and the Lambda audit processor via Terraform, so that the platform has secure firmware storage, a performant frontend delivery mechanism, and automated audit logging.

## Acceptance Criteria
- [ ] AC1: When I apply the `s3-firmware` module, a firmware bucket is created with: KMS encryption, versioning enabled, all public access blocked, SSL enforcement via bucket policy, and Glacier lifecycle (archive after 365 days)
- [ ] AC2: When I apply with `s3_firmware_object_lock = true` (staging/prod), Object Lock (WORM) is enabled with the appropriate retention mode (governance for staging, compliance for prod)
- [ ] AC3: When I apply the `s3-frontend` module, a frontend bucket is created with Origin Access Identity policy allowing only CloudFront to read objects
- [ ] AC4: When I apply the `cloudfront` module, a CloudFront distribution is created with: S3 origin via OAI, custom error responses for SPA routing (404 -> /index.html with 200), and HTTPS enforcement
- [ ] AC5: When I apply the `lambda-audit` module, a Lambda function is created with: Node.js 20.x runtime, the audit processor source code bundled, and an event source mapping to DynamoDB Streams (batch size 25, retry 3, TRIM_HORIZON)
- [ ] AC6: When I apply the `lambda-audit` module, a CloudWatch Log Group is created with environment-specific retention (7/30/90 days)
- [ ] AC7: When a DynamoDB record is created (e.g., a device), the Lambda function is triggered and writes an AUDIT# record back to the table within 5 seconds

## UI Behavior
- N/A (infrastructure-only story)

## Out of Scope
- WAF association with CloudFront (Story 17.5)
- Route53 DNS + ACM certificate (Story 17.5)
- CloudWatch dashboards (Story 17.6)
- Frontend deployment (CI/CD handles this)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for S3 firmware settings (Section 7), Lambda specification (Section 8), and CloudFront module.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

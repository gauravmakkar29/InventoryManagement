# Story 8.1: Audit Stream Lambda Processor

**Epic:** Epic 8 — Audit Trail
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Admin, I want all data changes in the system to be automatically recorded as audit log entries, so that I have a complete and tamper-proof record of who changed what and when for compliance reporting.

## Acceptance Criteria
- [ ] AC1: When a device is created via the platform, an audit log entry is automatically generated with action "Created", the resource type "Device", and the resource ID
- [ ] AC2: When a firmware record is modified (e.g., status change), an audit log entry is automatically generated with action "Modified"
- [ ] AC3: When a service order is deleted, an audit log entry is automatically generated with action "Deleted"
- [ ] AC4: When an audit log entry is created, it includes: action, resource type, resource ID, user ID, timestamp, and a status of "Success"
- [ ] AC5: When an audit log record is older than 90 days, it is automatically removed by the system (TTL expiry)
- [ ] AC6: When the audit processor encounters an error, it retries up to 3 times before discarding the event

## UI Behavior
- This story is backend-only; there is no direct user interface
- The audit log entries generated here are consumed by the Audit Log tab (Story 8.3) and Analytics page (Story 7.5)
- Users do not trigger audit creation manually; it happens automatically on every data change

## Out of Scope
- Frontend display of audit logs (covered in Story 8.3)
- Notification generation from audit events (covered in separate notification stories)
- Custom audit log messages or user-provided notes on changes

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Lambda processing logic, DynamoDB Stream configuration, and infinite loop prevention.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

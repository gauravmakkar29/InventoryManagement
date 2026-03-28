# Story 10.6: Amazon Location Service Terraform Infrastructure

**Epic:** Epic 10 — Amazon Location Service
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 3

## User Story
As a Platform Admin, I want the Amazon Location Service resources (map, place index, geofence collection, and tracker) provisioned via Terraform, so that the mapping infrastructure is reproducible, version-controlled, and consistent across environments.

## Acceptance Criteria
- [ ] AC1: When Terraform is applied, an Amazon Location Map resource is created with the specified style (VectorEsriNavigation)
- [ ] AC2: When Terraform is applied, an Amazon Location Place Index is created with Esri as the data provider
- [ ] AC3: When Terraform is applied, an Amazon Location Geofence Collection is created for geofence management
- [ ] AC4: When Terraform is applied, an Amazon Location Tracker is created and associated with the Geofence Collection
- [ ] AC5: When Terraform is applied, the Cognito Identity Pool or AppSync role receives IAM permissions for all Location Service operations (map tiles, geocoding, geofences, tracking)
- [ ] AC6: When Terraform is destroyed in a dev environment, all Location Service resources are cleanly removed

## UI Behavior
- This story is infrastructure-only; there is no direct user interface
- The resources created by this story are consumed by Stories 10.1 through 10.5
- Resource names follow the convention: `ims-gen2-{resource}` (e.g., `ims-gen2-map`, `ims-gen2-places`)

## Out of Scope
- Frontend code that uses these resources (covered in Stories 10.1-10.5)
- EventBridge rules for geofence entry/exit events
- CloudWatch monitoring for Location Service API usage
- Cost optimization or budget alerts for Location Service

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Terraform resource definitions and IAM policy specifications.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

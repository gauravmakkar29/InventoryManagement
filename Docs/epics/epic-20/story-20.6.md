# Story 20.6: Firmware Version History & Point-in-Time Timeline

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 2: FIRMWARE LIFECYCLE
**Persona:** Michael (Sungrow Stakeholder) / Raj (Operations Manager)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** #388
**Target URL:** `/deployment/firmware/:firmwareId`

## User Story

As an operations manager, I want to see the complete version history of any firmware package with a point-in-time timeline, so that I can trace every state change from initial upload through compliance review to deployment.

## Preconditions

- Epic 4 firmware entity model exists (Firmware type in `src/lib/types.ts`)
- Firmware list and card display (Story 4.1) is implemented
- DynamoDB single-table design with PK=firmware pattern

## Context / Business Rules

- **Michael's requirement (from standup):** "Show me the history of this firmware" — dropdown in top-right corner showing full evolution. Go back to any point in time and see SBOM, HBOM, compliance status, who did what.
- **Firmware families:** Every firmware is one family; versions are records within the family. Version 1.0 → Guidepoint reviews → rejected → developer fixes → uploads 1.1 → approved → deployed to customer site.
- **Version immutability:** Once a version record is created, it cannot be modified. New actions create new version records. This is the audit trail.
- **DynamoDB schema:** PK = `FIRMWARE#{familyId}`, SK = `VERSION#{semver}#TIMESTAMP#{iso}`. Each record captures the state snapshot at that point in time.
- **Rollback visibility:** If v1.1 is deployed and later v1.0 is restored at a site, the timeline shows both events.

## Acceptance Criteria

- [ ] AC1: `FirmwareFamily` and `FirmwareVersion` types are defined in `src/lib/types.ts` — family has: id, name, targetModel, currentVersion, createdAt. Version has: id, familyId, version (semver), status, uploadedBy, uploadedAt, checksum, sbomUrl, hbomUrl, complianceStatus, complianceReviewedBy, complianceNote, changelog
- [ ] AC2: `IApiProvider` is extended with methods: `listFirmwareFamilies`, `getFirmwareFamily`, `listFirmwareVersions(familyId)`, `getFirmwareVersion(familyId, version)`, `createFirmwareVersion`
- [ ] AC3: Mock API provider returns 3+ firmware families, each with 3+ versions showing realistic lifecycle progression (new → testing → rejected → resubmitted → approved → deployed)
- [ ] AC4: Firmware detail page (`/deployment/firmware/:firmwareId`) shows a **version dropdown** in the top-right corner listing all versions (latest first)
- [ ] AC5: Selecting a version shows the full snapshot: metadata, compliance status, SBOM/HBOM links, who performed each action, and timestamps
- [ ] AC6: A **visual timeline** (vertical, Ant-style) shows all state transitions for the selected firmware family — each node shows: action, actor, timestamp, and optional note
- [ ] AC7: Timeline entries are color-coded: green (approved/deployed), red (rejected), blue (uploaded/submitted), gray (informational)
- [ ] AC8: Page shows skeleton loading states while data loads

## UI Behavior

- Version dropdown uses shadcn/ui Select component, shows version + status badge
- Timeline is a vertical stepper on the left side or below the firmware detail card
- Each timeline node is compact: icon + actor + action + relative timestamp (e.g., "3 days ago")
- Clicking a timeline node scrolls to and highlights the corresponding version detail
- Mobile: timeline collapses to an expandable accordion

## Out of Scope

- Firmware file upload (Story 4.2 + Story 20.1/20.2 for artifact provider)
- Customer site deployment tracking (Story 20.7)
- CDC event streaming (Story 20.8)
- Editing or deleting firmware versions (immutable by design)

## Dev Checklist (NOT for QA)

1. Add `FirmwareFamily` and `FirmwareVersion` types to `src/lib/types.ts`
2. Extend `IApiProvider` with firmware family/version methods
3. Update `MockApiProvider` with realistic firmware family + version data
4. Create `src/app/components/firmware/firmware-detail-page.tsx`
5. Create `src/app/components/firmware/firmware-version-timeline.tsx`
6. Create `src/app/components/firmware/firmware-version-selector.tsx`
7. Add route `/deployment/firmware/:firmwareId` to router
8. Write unit tests for new components and mock data

## AutoGent Test Prompts

1. **AC2-AC3 — API layer:** "Call listFirmwareFamilies(). Verify at least 3 families returned. Call listFirmwareVersions('fw-family-001'). Verify at least 3 versions returned. Verify versions are ordered by createdAt descending."

2. **AC4-AC5 — Version dropdown:** "Navigate to /deployment/firmware/fw-family-001. Verify the version dropdown is visible in the top-right. Open the dropdown. Verify it lists all versions with status badges. Select version 1.0. Verify the detail panel updates to show v1.0 metadata, compliance status, and SBOM/HBOM links."

3. **AC6-AC7 — Timeline:** "On the firmware detail page, verify a vertical timeline is visible. Verify it shows at least 3 state transitions. Verify approved entries have green indicators. Verify rejected entries have red indicators. Verify each node shows actor name and relative timestamp."

4. **AC8 — Loading states:** "Navigate to /deployment/firmware/fw-family-001 with network throttled. Verify skeleton placeholders appear for the version dropdown, detail panel, and timeline before data loads."

5. **Full lifecycle flow:** "Navigate to firmware detail for a family that has a rejected version. Use the version dropdown to switch between the rejected version and the subsequent approved version. Verify the timeline reflects the full journey: upload → testing → rejected (with note) → re-upload → approved → deployed."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test for timeline navigation
- [ ] Responsive layout verified (desktop, tablet, mobile)
- [ ] WCAG 2.1 AA — timeline is keyboard navigable
- [ ] Compliance check green

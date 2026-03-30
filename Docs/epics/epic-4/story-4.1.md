# Story 4.1: Firmware List and Card Display

**Epic:** Epic 4 — Deployment & Firmware Lifecycle
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story

As an operations manager, I want to view all firmware packages as cards with their version, model, and approval status, so that I can monitor the firmware deployment pipeline.

## Acceptance Criteria

- [x] AC1: When I navigate to `/deployment`, I see a "Firmware" tab (selected by default) displaying firmware packages as cards in a grid
- [x] AC2: Each firmware card shows: name, version, target device model, checksum, uploaded by, and upload date
- [x] AC3: Each card includes an Approval Stage Indicator showing the 3-step pipeline: Uploaded -> Testing -> Approved
- [x] AC4: Completed stages show a green checkmark with the name and date of who performed the action; the current stage is highlighted; future stages are grayed out
- [ ] AC5: When data is loading, skeleton card placeholders are shown
- [x] AC6: When no firmware packages exist, I see "No firmware packages found" with an "Upload Firmware" call-to-action

## UI Behavior

- Cards displayed in a responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- Cards are compact and information-dense per enterprise design principles
- Approval Stage Indicator is a horizontal 3-step progress element at the bottom of each card
- Firmware with status "Deprecated" shows a muted/strikethrough visual treatment
- Cards with approval stage "Uploaded" (awaiting action) have a subtle highlight border

## Out of Scope

- Firmware file upload (covered in Story 4.2)
- Stage advancement actions (covered in Story 4.3)
- Filtering or searching firmware

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Firmware entity model, ApprovalStageIndicator component, and `listFirmware` query.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
- [x] Implementation complete (deployment.tsx — 8 mock firmware entries, responsive 3/2/1 grid, ApprovalPipeline, empty state)

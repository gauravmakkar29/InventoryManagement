# Story 3.3: Create Device Form

**Epic:** Epic 3 — Inventory & Device Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a platform admin, I want to add new devices to the inventory, so that newly deployed hardware is tracked in the system from day one.

## Acceptance Criteria
- [ ] AC1: When I am an Admin or Manager, I see a "Add Device" button above the hardware inventory table
- [ ] AC2: When I click "Add Device", a modal opens with a form containing fields: Device Name, Serial Number, Device Model (dropdown), Firmware Version (dropdown), Status (dropdown: Online/Offline/Maintenance), Location, Latitude, Longitude, Customer (dropdown)
- [ ] AC3: When I submit the form with all required fields filled, the device is created and appears in the table without a page refresh
- [ ] AC4: When I submit the form with missing required fields, inline validation errors appear on the empty fields and submission is blocked
- [ ] AC5: When the device creation API call fails, I see a toast error "Failed to create device. Please try again."
- [ ] AC6: When I am a Technician, Viewer, or CustomerAdmin, the "Add Device" button is not visible

## UI Behavior
- Modal uses the Dialog component (shadcn/ui) with a form built using react-hook-form
- Required fields are marked with a red asterisk
- Location field is a text input; Lat/Lng fields are numeric inputs
- Customer dropdown is populated from the customer list
- Firmware Version dropdown is populated from active firmware packages
- On successful creation, the modal closes and a success toast appears: "Device [name] created"
- Cancel button closes the modal without saving

## Out of Scope
- Editing existing devices
- Deleting devices
- Bulk device import
- Geocoding from location string (manual lat/lng entry for now)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Device entity model, `createDevice` mutation, and GSI key computation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

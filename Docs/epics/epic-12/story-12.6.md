# Story 12.6: SBOM Summary Cards and List View

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story
As an Operations Manager, I want to see a list of all uploaded SBOMs with summary information for each one, so that I can monitor the supply chain security status across all firmware versions at a glance.

## Acceptance Criteria
- [ ] AC1: When I navigate to the "SBOM Management" tab, I see a list of all uploaded SBOMs displayed as cards
- [ ] AC2: When I view an SBOM card, it shows: linked firmware name + version, format badge (CycloneDX/SPDX), component count, vulnerability count, and upload date
- [ ] AC3: When an SBOM has critical vulnerabilities, its card displays a red severity summary bar showing the breakdown (Critical/High/Medium/Low)
- [ ] AC4: When an SBOM is still processing, its card shows a "Processing" status badge with a spinner
- [ ] AC5: When an SBOM had a parsing error, its card shows an "Error" status badge in red
- [ ] AC6: When I click "View Details" on an SBOM card, I am taken to the Component Explorer tab filtered to that SBOM's components
- [ ] AC7: When I filter by firmware model, only SBOMs linked to firmware of that model are shown

## UI Behavior
- SBOM cards are displayed in a vertical list or responsive grid (2 columns on desktop, 1 on mobile)
- Each card has a compact layout: firmware name/version as header, metadata in a grid below
- Severity summary bar is a horizontal stacked bar (colored segments proportional to vuln counts)
- Status badges: Complete = green, Processing = blue with spinner, Error = red
- Format badge: CycloneDX = blue, SPDX = purple
- Filter dropdown for firmware model is positioned above the card list
- "View Details" is a text link or small button at the card's bottom-right
- Cards are sorted by upload date (newest first) by default

## Out of Scope
- Deleting or re-processing SBOMs
- Comparing two SBOMs (diff view)
- Downloading the original SBOM file
- SBOM version history for the same firmware

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for SBOM entity and listSBOMsByFirmware query.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

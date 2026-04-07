# Story 20.7: Customer & Site Entity Model + Firmware Association

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 2: DOMAIN MODEL
**Persona:** Michael (Sungrow Stakeholder) / Raj (Operations Manager)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** #389
**Target URL:** `/customers`, `/customers/:customerId`

## User Story

As an operations manager, I want to manage customers and their sites with firmware deployment associations, so that I can answer "What firmware version is deployed at which customer site?" at any point in time.

## Preconditions

- Epic 4 firmware entity model exists
- Story 20.6 firmware versioning is defined (FirmwareFamily, FirmwareVersion types)
- DynamoDB single-table design pattern is established

## Context / Business Rules

- **Michael's key question (from standup):** "What version of the firmware is deployed to my site?" — the system must track which firmware version is deployed at which customer site.
- **Customer → Sites → Deployments:** A customer has multiple sites. Each site has devices. Each device runs a specific firmware version. This is the traceability chain.
- **DynamoDB schema (Abdul's direction):** PK is always firmware-centric. SK = customer/site for the association. Abdul wants to see schemas debated and finalized.
- **CRM as source of truth:** Customer master data comes from CRM (Story 20.3/20.4). IMS stores a denormalized copy for firmware association. Sync keeps them aligned.
- **Field service technicians:** They log into the app and need to see what's deployed at their assigned sites. Access is selective (per Abdul — "adversarial relationship with HQ, selective access").

## Acceptance Criteria

- [ ] AC1: `Customer` type extended and `Site` type defined in `src/lib/types.ts` — Customer: id, name, contactEmail, contractType, region, sites (array). Site: id, customerId, name, address, coordinates, devices (array), primaryContact
- [ ] AC2: `SiteDeployment` type defined — links a site to a firmware version: siteId, firmwareVersionId, deployedAt, deployedBy, status (active/rollback/pending), previousVersionId
- [ ] AC3: `IApiProvider` extended with: `listCustomers`, `getCustomer`, `listSites(customerId)`, `getSite`, `listSiteDeployments(siteId)`, `deploySiteUpdate(siteId, firmwareVersionId)`, `rollbackSiteDeployment(siteId, previousVersionId)`
- [ ] AC4: Mock API returns 5+ customers, each with 2+ sites, each site with 1+ deployment history entries
- [ ] AC5: Customer list page (`/customers`) shows a searchable, filterable table with columns: name, region, sites count, active firmware versions, last deployment date
- [ ] AC6: Customer detail page (`/customers/:customerId`) shows customer info + sites list. Each site card shows: name, address, current firmware version (badge), deployment status
- [ ] AC7: Clicking a site expands to show deployment history — timeline of firmware versions deployed/rolled back at that site
- [ ] AC8: From firmware detail page (Story 20.6), a "Deployed Sites" tab shows all sites running that firmware version

## UI Behavior

- Customer table uses existing DataTable pattern (compact, enterprise-style)
- Site cards in a responsive grid (2 columns desktop, 1 mobile)
- Firmware version badge is color-coded: green (latest), yellow (outdated), red (vulnerability found)
- Deployment timeline reuses the timeline component from Story 20.6
- Search supports customer name, site name, region

## Out of Scope

- CRM sync automation (Story 20.3/20.4 provides the data)
- Device-level firmware tracking (Epic 3 covers device management)
- Geo-location map view of sites (Epic 9/10 covers location services)
- Field service technician role restrictions (Epic 1 covers RBAC)

## Dev Checklist (NOT for QA)

1. Extend `Customer` type and add `Site`, `SiteDeployment` types to `src/lib/types.ts`
2. Extend `IApiProvider` with customer/site/deployment methods
3. Update `MockApiProvider` with customer/site/deployment mock data
4. Create `src/app/components/customers/customer-list-page.tsx`
5. Create `src/app/components/customers/customer-detail-page.tsx`
6. Create `src/app/components/customers/site-card.tsx`
7. Create `src/app/components/customers/site-deployment-timeline.tsx`
8. Add routes: `/customers`, `/customers/:customerId`
9. Add "Deployed Sites" tab to firmware detail page (Story 20.6)
10. Write unit tests for all new components

## AutoGent Test Prompts

1. **AC5 — Customer list:** "Navigate to /customers. Verify a data table is visible with columns: name, region, sites count, active firmware, last deployment. Verify at least 5 rows. Search for 'solar'. Verify table filters to matching customers."

2. **AC6 — Customer detail:** "Click on first customer in the list. Verify navigation to /customers/:id. Verify customer info panel shows name, email, contract type. Verify site cards are visible. Verify each site card shows firmware version badge."

3. **AC7 — Site deployment history:** "On customer detail page, click a site card. Verify it expands to show deployment timeline. Verify timeline shows at least one entry with: firmware version, deployed by, deployed date, status."

4. **AC8 — Cross-reference from firmware:** "Navigate to /deployment/firmware/fw-family-001. Click 'Deployed Sites' tab. Verify it lists all sites running this firmware. Verify each entry shows customer name, site name, and deployment date."

5. **Deployment tracking:** "On customer detail, find a site with 'outdated' firmware badge. Verify the badge is yellow. Click the site to see history. Verify the timeline shows the current version and the available newer version."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test for customer → site → deployment flow
- [ ] Responsive layout verified (desktop, tablet, mobile)
- [ ] WCAG 2.1 AA — tables and cards keyboard navigable
- [ ] Compliance check green

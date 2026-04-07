# Story 20.3: CRM/Ticketing Provider Interface + Mock Adapter

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 1: PROVIDER INTERFACES
**Persona:** Prince (Lead Developer) / Template Consumer
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** #385
**Target URL:** N/A (library layer — no UI)

## User Story

As a platform developer, I want a pluggable `ICRMProvider` interface with a mock adapter, so that any CRM or ticketing system (ServiceNow, Jira, Salesforce, Zendesk) can be integrated without changing business logic.

## Preconditions

- Provider registry and `PlatformConfig` are functional
- Existing provider pattern is the reference implementation
- Story 20.1 has established the pattern for new provider interfaces

## Context / Business Rules

- **Bidirectional vs one-way:** The interface must support both push (create ticket in CRM) and pull (fetch customer/ticket data from CRM). Abdul noted direction of sync is TBD — so design for both.
- **Lambda-mediated:** All CRM calls route through Lambda (REST outbound). Adapter never calls CRM API directly from browser.
- **Customer/Site association:** CRM data feeds into IMS customer/site entities. The provider is the source of truth for customer master data.
- **Ticket lifecycle:** Create, update, close, add comment, attach file. Maps to service order workflow in IMS.

## Acceptance Criteria

- [ ] AC1: `ICRMProvider` interface is defined in `src/lib/providers/types.ts` with methods: `getCustomer`, `listCustomers`, `searchCustomers`, `createTicket`, `updateTicket`, `getTicket`, `listTickets`, `addTicketComment`, `attachFile`, `syncCustomerData`
- [ ] AC2: Generic types defined: `CRMCustomer`, `CRMTicket`, `CRMTicketInput`, `CRMComment`, `CRMSyncResult`, `CRMProviderConfig`
- [ ] AC3: `MockCRMProvider` is implemented in `src/lib/providers/mock/mock-crm-provider.ts` with realistic mock data (5+ customers, 10+ tickets across statuses)
- [ ] AC4: `PlatformConfig` is extended with a `crm: ICRMProvider` field
- [ ] AC5: `useCRM()` hook is created in `src/lib/hooks/` wrapping TanStack Query for queries and mutations
- [ ] AC6: Mock adapter supports filtering tickets by status, customer, and date range
- [ ] AC7: Unit tests cover all mock adapter methods with ≥ 85% coverage

## Out of Scope

- ServiceNow concrete adapter (Story 20.4)
- Jira, Salesforce, or other CRM adapters (future stories)
- Customer entity UI (Story 20.7 covers the model + association)
- Bidirectional sync scheduler (infra layer)

## Dev Checklist (NOT for QA)

1. Add `ICRMProvider` + types to `src/lib/providers/types.ts`
2. Create `src/lib/providers/mock/mock-crm-provider.ts`
3. Extend `PlatformConfig` with `crm` field
4. Update provider registry
5. Create `src/lib/hooks/use-crm.ts`
6. Wire mock adapter in `platform.config.ts`
7. Write unit tests

## AutoGent Test Prompts

1. **AC1-AC2 — Interface contract:** "Import ICRMProvider from types.ts. Verify it has exactly 10 methods. Verify CRMCustomer has fields: id, name, sites (array), contactEmail, contractType. Verify CRMTicket has fields: id, customerId, subject, status, priority, assignedTo, createdAt, updatedAt."

2. **AC3 — Mock data quality:** "Create a MockCRMProvider. Call listCustomers(). Verify at least 5 customers returned. Call listTickets(). Verify at least 10 tickets with mixed statuses (open, in-progress, resolved, closed)."

3. **AC6 — Filtering:** "Call listTickets({ status: 'open' }). Verify all returned tickets have status 'open'. Call listTickets({ customerId: 'cust-001' }). Verify all returned tickets belong to that customer."

4. **AC5 — Hook integration:** "Render a test component using useCRM hook. Call createTicket mutation with test data. Verify optimistic update shows the ticket. Verify the ticket appears in subsequent listTickets query."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No vendor-specific imports in interface file
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

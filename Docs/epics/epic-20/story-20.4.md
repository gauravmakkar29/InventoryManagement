# Story 20.4: ServiceNow CRM Adapter

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 1: PROVIDER INTERFACES
**Persona:** Prince (Lead Developer) / Justin (DevOps)
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** #386
**Target URL:** N/A (library layer — no UI)

## User Story

As a platform developer, I want a ServiceNow adapter implementing `ICRMProvider`, so that the PoC can create and manage service tickets and sync customer data from Sungrow's ServiceNow instance.

## Preconditions

- Story 20.3 is complete — `ICRMProvider` interface and mock adapter exist
- Lambda endpoints for CRM operations are defined
- ServiceNow access status clarified (licensed product — may need sandbox instance)

## Context / Business Rules

- **ServiceNow as CRM source:** Sungrow uses ServiceNow for CRM/ticketing. IMS reads customer data from ServiceNow and creates tickets for service orders.
- **All calls via Lambda:** Adapter calls Lambda endpoint, Lambda calls ServiceNow REST API using credentials from Secrets Manager. Browser never touches ServiceNow directly.
- **Sync model:** Initial implementation is pull-based (IMS fetches on demand). Push-based sync (ServiceNow webhook → Lambda → IMS) is a future enhancement.
- **ServiceNow Table API:** Uses `/api/now/table/{tableName}` pattern. Adapter must map IMS types to ServiceNow table fields (incident, cmdb_ci, customer_contact).

## Acceptance Criteria

- [ ] AC1: `ServiceNowCRMProvider` is implemented in `src/lib/providers/servicenow/servicenow-crm-provider.ts` implementing all `ICRMProvider` methods
- [ ] AC2: Adapter accepts config: `{ lambdaEndpoint: string, instanceId?: string, timeout?: number }`
- [ ] AC3: Field mapping layer translates between IMS `CRMCustomer`/`CRMTicket` types and ServiceNow table schemas (incident, cmdb_ci, customer_contact)
- [ ] AC4: `createTicket()` maps IMS ticket input to ServiceNow incident fields and POSTs via Lambda
- [ ] AC5: `syncCustomerData()` fetches customer records from ServiceNow and returns `CRMSyncResult` with counts (created, updated, skipped, errors)
- [ ] AC6: Error handling maps ServiceNow error codes to existing `ApiError` classification
- [ ] AC7: `platform.config.ts` is updated with ServiceNow wiring option
- [ ] AC8: Unit tests with ≥ 85% coverage using MSW to mock Lambda→ServiceNow responses

## Out of Scope

- ServiceNow instance provisioning (DevOps/Justin task)
- Push-based sync (webhook from ServiceNow → Lambda)
- ServiceNow OAuth setup (Secrets Manager / infra layer)
- Other CRM adapters (Jira, Salesforce — future stories)

## Dev Checklist (NOT for QA)

1. Create `src/lib/providers/servicenow/servicenow-crm-provider.ts`
2. Create field mapping utility `servicenow-field-map.ts` in same folder
3. Implement all 10 `ICRMProvider` methods
4. Add ServiceNow-specific error mapping
5. Update `platform.config.ts` with `servicenow` platform wiring
6. Write MSW handlers simulating Lambda→ServiceNow responses
7. Write unit tests

## AutoGent Test Prompts

1. **AC1-AC2 — Adapter instantiation:** "Create a ServiceNowCRMProvider with config { lambdaEndpoint: 'https://test.execute-api.us-east-2.amazonaws.com/crm' }. Verify it implements ICRMProvider. Verify all 10 methods are callable."

2. **AC3-AC4 — Field mapping:** "Call createTicket({ subject: 'Firmware update failed', priority: 'high', customerId: 'cust-001' }). Verify the Lambda request body maps to ServiceNow incident fields: short_description, urgency=1, caller_id."

3. **AC5 — Customer sync:** "Mock Lambda to return 3 ServiceNow customer_contact records. Call syncCustomerData(). Verify CRMSyncResult shows created=3. Call again with same data. Verify updated=3, created=0."

4. **AC6 — Error handling:** "Mock Lambda to return ServiceNow error { error: { message: 'Record not found' }, status: 'failure' }. Call getTicket('bad-id'). Verify ApiError with classification 'not-found'."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No direct ServiceNow SDK imports — all calls via Lambda endpoint
- [ ] Passes same ICRMProvider interface compliance test suite as mock
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

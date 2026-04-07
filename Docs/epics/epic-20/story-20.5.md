# Story 20.5: Compliance Scanner Provider Interface + Ignite/Mock Adapters

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 1: PROVIDER INTERFACES
**Persona:** Prince (Lead Developer) / Template Consumer
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** #387
**Target URL:** N/A (library layer — no UI)

## User Story

As a platform developer, I want a pluggable `IComplianceScannerProvider` interface with mock and Ignite adapters, so that any compliance/vulnerability scanning tool (Ignite, Qualys, Tenable, Snyk) can be integrated without changing business logic.

## Preconditions

- Provider registry and `PlatformConfig` are functional
- Story 20.1 pattern established for new provider interfaces
- Sungrow Ignite access is pending (Sohil coordinating with Hudson)

## Context / Business Rules

- **Guidepoint workflow:** Guidepoint runs security/vulnerability tests on firmware artifacts. They mark firmware as compliance-pass or compliance-rejected, with a report upload.
- **Ignite is licensed:** Access pending from Sungrow. Adapter must be developed against mock data initially, then validated when access is granted.
- **Scan lifecycle:** Submit artifact for scan → poll for results → retrieve report (pass/fail + vulnerability list). Maps to firmware approval pipeline (Uploaded → Testing → Approved/Rejected).
- **Report extraction:** Abdul mentioned possibly using AI to extract individual vulnerabilities from scan reports. The interface should support both structured (API returns individual vulns) and unstructured (report PDF upload) patterns.

## Acceptance Criteria

- [ ] AC1: `IComplianceScannerProvider` interface defined in `src/lib/providers/types.ts` with methods: `submitScan`, `getScanStatus`, `getScanReport`, `listVulnerabilities`, `uploadReport`, `getComplianceScore`, `listScanHistory`
- [ ] AC2: Generic types defined: `ScanRequest`, `ScanStatus`, `ScanReport`, `ScanVulnerability`, `ComplianceScore`, `ScannerProviderConfig`
- [ ] AC3: `MockComplianceScannerProvider` in `src/lib/providers/mock/mock-scanner-provider.ts` with realistic data (CVSS scores, CVE IDs, pass/fail reports)
- [ ] AC4: `IgniteComplianceScannerProvider` in `src/lib/providers/ignite/ignite-scanner-provider.ts` — stub implementation calling Lambda endpoint (full implementation when access granted)
- [ ] AC5: `PlatformConfig` extended with `complianceScanner: IComplianceScannerProvider`
- [ ] AC6: `useComplianceScanner()` hook created with TanStack Query — includes polling for scan status with configurable interval
- [ ] AC7: Mock adapter simulates scan lifecycle: submitted → scanning (2s delay) → completed with report
- [ ] AC8: Unit tests ≥ 85% coverage for mock adapter

## Out of Scope

- Qualys, Tenable, Snyk adapters (future stories)
- AI-based vulnerability extraction from PDF reports (future)
- Ignite API integration (blocked on access — stub only for now)
- UI for scan results (existing compliance/vulnerability tabs consume hooks)

## Dev Checklist (NOT for QA)

1. Add `IComplianceScannerProvider` + types to `src/lib/providers/types.ts`
2. Create `src/lib/providers/mock/mock-scanner-provider.ts`
3. Create `src/lib/providers/ignite/ignite-scanner-provider.ts` (stub)
4. Extend `PlatformConfig` with `complianceScanner` field
5. Create `src/lib/hooks/use-compliance-scanner.ts` with polling support
6. Wire mock adapter in `platform.config.ts`
7. Write unit tests

## AutoGent Test Prompts

1. **AC1-AC2 — Interface contract:** "Import IComplianceScannerProvider. Verify 7 methods exist. Verify ScanReport has fields: id, artifactId, status (pass/fail/pending), vulnerabilities (array), score, generatedAt, scanner."

2. **AC3-AC7 — Scan lifecycle:** "Create MockComplianceScannerProvider. Call submitScan({ artifactId: 'fw-001' }). Verify status is 'submitted'. Wait 2s, call getScanStatus(scanId). Verify status progresses to 'completed'. Call getScanReport(scanId). Verify report has vulnerabilities array and ComplianceScore."

3. **AC6 — Polling hook:** "Render component with useComplianceScanner hook. Submit a scan. Verify the hook polls getScanStatus every 3 seconds. Verify it stops polling when status is 'completed'. Verify final report data is available."

4. **AC4 — Ignite stub:** "Create IgniteComplianceScannerProvider with config. Verify it implements IComplianceScannerProvider. Call submitScan(). Verify it calls the Lambda endpoint correctly. Verify error handling when Lambda returns 503 (Ignite unavailable)."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No vendor-specific imports in interface file
- [ ] Ignite stub is clearly marked with TODO comments for when access is granted
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

# Story 20.10: DNS Provider Interface + Azure DNS / Route 53 Adapters

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 1: PROVIDER INTERFACES
**Persona:** Justin (DevOps) / Template Consumer
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** #392
**Target URL:** N/A (infra config layer — no UI)

## User Story

As a platform developer, I want a pluggable `IDNSProvider` interface with Azure DNS and Route 53 adapters, so that the platform can route traffic through the client's existing DNS provider without being locked to AWS Route 53.

## Preconditions

- CloudFront distribution is provisioned via Amplify
- Client (Sungrow) has confirmed they already have Azure DNS managing their `sungrow.com` domain
- Prince confirmed: CloudFront alternate domain config picks up the existing domain — no Route 53 dependency

## Context / Business Rules

- **Client reality:** Sungrow already owns `sungrow.com` on Azure DNS. They do NOT want Route 53. The app will be accessed via `aegis.sungrow.com` (or similar), routed from Azure DNS → CloudFront via CNAME.
- **Template flexibility:** Other adopters may use Route 53, GCP Cloud DNS, or Cloudflare. The interface abstracts DNS record management.
- **What the adapter does:** Creates/updates CNAME or A records pointing to the CloudFront distribution. Handles SSL certificate validation (ACM DNS validation records). Reports DNS propagation status.
- **Minimal surface area:** DNS operations are infrequent (initial setup, environment provisioning, cert renewals). The adapter is thin — mostly Terraform/CDK config generation, not runtime API calls.
- **Environment domains:** The adapter supports per-environment subdomains: `aegis-dev.sungrow.com`, `aegis-qa.sungrow.com`, `aegis.sungrow.com` (prod).

## Acceptance Criteria

- [ ] AC1: `IDNSProvider` interface defined in `src/lib/providers/types.ts` with methods: `createRecord`, `updateRecord`, `deleteRecord`, `getRecord`, `listRecords`, `validateCertificate`, `checkPropagation`
- [ ] AC2: Generic types: `DNSRecord` (type: CNAME/A/AAAA, name, value, ttl), `DNSProviderConfig` (provider, domain, hostedZoneId?), `CertValidationResult`, `PropagationStatus`
- [ ] AC3: `AzureDNSProvider` implemented in `src/lib/providers/azure/azure-dns-provider.ts` — generates CNAME record config pointing to CloudFront distribution domain, supports ACM certificate DNS validation
- [ ] AC4: `Route53DNSProvider` implemented in `src/lib/providers/aws-amplify/amplify-dns-provider.ts` — as the template fallback for AWS-native deployments
- [ ] AC5: `MockDNSProvider` in `src/lib/providers/mock/mock-dns-provider.ts` — simulates record creation, propagation delay (2s), and certificate validation
- [ ] AC6: `PlatformConfig` extended with `dns: IDNSProvider`
- [ ] AC7: DNS adapter generates Terraform/CDK-compatible config snippets for the selected provider (output as JSON that infra layer consumes)
- [ ] AC8: Unit tests ≥ 85% for all three adapters

## Out of Scope

- Actual DNS record creation in Azure/AWS (that's Terraform/infra layer)
- SSL certificate provisioning (ACM handles this — adapter just facilitates DNS validation)
- GCP Cloud DNS, Cloudflare adapters (future stories)
- Domain purchase or transfer

## Dev Checklist (NOT for QA)

1. Add `IDNSProvider` + types to `src/lib/providers/types.ts`
2. Create `src/lib/providers/azure/azure-dns-provider.ts`
3. Create `src/lib/providers/aws-amplify/amplify-dns-provider.ts`
4. Create `src/lib/providers/mock/mock-dns-provider.ts`
5. Extend `PlatformConfig` with `dns` field
6. Update `platform.config.ts` — Azure DNS as default for PoC, Route 53 as AWS template fallback
7. Write unit tests for all adapters

## AutoGent Test Prompts

1. **AC1-AC2 — Interface contract:** "Import IDNSProvider from types.ts. Verify 7 methods exist. Verify DNSRecord has fields: type (CNAME/A/AAAA), name, value, ttl. Verify DNSProviderConfig has fields: provider, domain."

2. **AC3 — Azure DNS CNAME:** "Create AzureDNSProvider with config { provider: 'azure', domain: 'sungrow.com' }. Call createRecord({ type: 'CNAME', name: 'aegis', value: 'd123.cloudfront.net', ttl: 300 }). Verify it generates Azure DNS-compatible config with the correct CNAME pointing to CloudFront."

3. **AC5 — Mock propagation:** "Create MockDNSProvider. Call createRecord(). Then call checkPropagation('aegis.sungrow.com'). Verify status is 'pending'. Wait 2s. Call again. Verify status is 'propagated'."

4. **AC7 — Terraform output:** "Call AzureDNSProvider.createRecord(). Verify the output includes a Terraform-compatible JSON snippet for azurerm_dns_cname_record resource. Call Route53DNSProvider.createRecord(). Verify output includes aws_route53_record resource."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No vendor-specific imports in interface file
- [ ] Azure DNS is wired as default for PoC config
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green

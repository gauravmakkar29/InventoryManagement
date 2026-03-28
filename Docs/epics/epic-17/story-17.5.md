# Story 17.5: WAF, DNS, ACM & Security Hardening

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Engineer, I want to provision WAF v2 protection, Route53 DNS, and ACM TLS certificates via Terraform, so that the platform is protected against common web attacks, accessible via a custom domain, and secured with HTTPS.

## Acceptance Criteria
- [ ] AC1: When I apply the `waf` module in production, a WAF v2 WebACL is created with: AWS Managed Common Rules, Known Bad Inputs Rules, SQLi Rules (all in block mode), and a rate-limiting rule (2,000 requests / 5 min per IP)
- [ ] AC2: When I apply the `waf` module in staging, all managed rules are in count-only mode (logging but not blocking)
- [ ] AC3: When I apply with `enable_waf = false` (dev), no WAF resources are created
- [ ] AC4: When I apply the `dns` module with a domain name, a Route53 hosted zone is created and an ACM certificate is requested with DNS validation records automatically created
- [ ] AC5: When the ACM certificate is validated, the CloudFront distribution and AppSync API are configured to use the custom domain with HTTPS
- [ ] AC6: When I apply all security modules together, the CloudFront distribution has: WAF WebACL associated, HTTPS-only viewer policy, TLSv1.2 minimum, and security response headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options)
- [ ] AC7: When I attempt to access the platform over HTTP, the request is redirected to HTTPS

## UI Behavior
- N/A (infrastructure-only story)

## Out of Scope
- VPN or VPC configuration
- AWS Shield Advanced
- Custom WAF rules beyond the managed rule sets

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for WAF v2 rules, DNS module, and environment-specific WAF configuration.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green

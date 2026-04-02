# ADR-008: Infrastructure as Reference Implementation

**Status:** Accepted
**Date:** 2026-04-02

## Context

IMS Gen 2 is evolving into a cloud-agnostic enterprise template. The initial implementation was tightly coupled to AWS Terraform, with NIST 800-53 control mappings pointing directly to Terraform module paths and AWS service names. This made it difficult for teams using other cloud providers (Azure, GCP) or IaC tools (CDK, Bicep, Pulumi) to adopt the template without rewriting compliance documentation.

Infrastructure code should not be a hard dependency of the template. The application layer already uses adapter interfaces (`IAuthAdapter`, `IApiProvider`, `IStorageProvider`) that abstract away cloud specifics. The compliance and security documentation should follow the same principle.

## Decision

All IaC code lives in `infra/reference/` as example implementations. The application depends only on the integration contract (`Docs/integration-contract.md`), not on any specific IaC tool or cloud provider.

Specifically:

1. **NIST 800-53 controls are split into two layers:**
   - **Template-enforced controls** (portable) — implemented in application code (`src/lib/rbac.ts`, `src/lib/security.ts`, session management, Zod schemas, GitHub CI). These ship with every deployment.
   - **Implementor-required controls** (infrastructure) — specified as requirements ("Your auth provider MUST...") without prescribing specific services or tools.

2. **The integration contract is the single source of truth** for the app-infrastructure interface, including security requirements (Section 6).

3. **Reference implementations serve as examples** showing how to satisfy implementor-required controls on a specific platform. They are not the only valid approach.

## Consequences

- **Positive:** Teams can adopt the template on any cloud provider. NIST compliance documentation applies regardless of infrastructure choice.
- **Positive:** The integration contract (Sections 1-6) gives infrastructure teams a complete specification of what the app needs, including security controls.
- **Positive:** Reference implementations in `infra/reference/aws-terraform/` and `infra/reference/aws-cdk/` serve as working examples without creating lock-in.
- **Positive:** Teams can use CDK, Terraform, Bicep, Pulumi, or manual setup — as long as they satisfy the contract.
- **Negative:** Implementors must map abstract requirements to their chosen platform. The reference implementations help, but Azure/GCP teams must do their own mapping.
- **Negative:** Two places to update when adding new security controls: the NIST mapping document and the integration contract.

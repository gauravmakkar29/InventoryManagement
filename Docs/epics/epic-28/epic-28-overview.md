# Epic 28 — Enterprise Compliance Workflow Patterns

## Vision

Ship a **reusable library of enterprise compliance primitives** on top of the IMS Gen 2 template — provider-abstracted, provider-swappable, domain-agnostic. Any team cloning the template for a regulated application (loan processing, clinical trials, contract lifecycle, GRC, release management, regulatory filings, etc.) gets the hard parts — immutable evidence storage, multi-document gated approvals, conditional exceptions with SLAs, scoped secure distribution, closed-loop provenance, and inverse dependency queries — out of the box. The IMS firmware flow is the **reference implementation** that exercises the patterns; the patterns themselves have no firmware knowledge.

## Business Context

Every regulated enterprise application rebuilds the same primitives badly:

- A file store that is tamper-evident _on paper_ but where an admin can still delete under the hood
- An approval workflow that is two-state (approved/rejected) when reality is four-state (including conditional/exception)
- A "waiver" capability that has no SLA, no alert, and quietly becomes permanent
- "Download link" features that are either not signed, not single-use, not MFA-gated, or not audit-logged
- Distribution records that say "shipped" without a corresponding "installed / confirmed" — a broken chain of custody
- "Impact analysis" features missing entirely — teams grep logs to find out which consumers run version X

For a template that aspires to be enterprise-grade, these seven primitives are **table stakes**. They are what make the difference between "the auditor accepts this evidence" and "the auditor wants more." ISO 27001, SOC 2, HIPAA, PCI-DSS, and NIST 800-53 all touch at least three of them.

This epic is explicitly **not Sungrow-specific, not firmware-specific, not IMS-specific**. The reference implementation uses firmware intake/review/distribute/confirm because that is the app in front of us, but the primitives are generic and the abstractions are provider-pluggable.

## Architecture Principles

1. **Provider abstraction first** — Every primitive is an interface with at least two implementations (a mock adapter and a reference cloud adapter). This extends the Epic 19 template pattern (`IAuthAdapter`, etc.) to compliance workflow adapters (`IEvidenceStore`, `IApprovalEngine`, `ISecureDistribution`, etc.).
2. **Domain-agnostic types** — No type in this epic references `Firmware`, `Device`, `SBOM`, or any IMS entity. Types use generic parameters (`Evidence<T>`, `Approval<T>`, `Consumer<T>`).
3. **Composable, not framework-ized** — Each primitive is independently useful. Consumers pick the pieces they need; there is no "enable the compliance framework" master switch.
4. **Reference implementation inside IMS** — Stories ship with working wiring in the firmware flow so the patterns are demonstrable and load-tested, not theoretical.
5. **Rulebook-compliant** — Every primitive honors `security-nist-rulebook.md` (AU-2/3 audit, AC-3 RBAC), `architecture-rulebook.md` (provider seams, error layering), `api-data-layer-rulebook.md` (TanStack Query, DTO/domain mapping), and `code-quality-rulebook.md` (no `any`, ≥85% coverage, file size limits).

## Enterprise Standards (MUST match existing codebase quality)

| Standard                                      | Reference Implementation                                   | Applies To                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Factory functions** (`createXxxProvider()`) | `createMockApiProvider()`, `createAmplifyAuthAdapter()`    | Every new primitive — `createS3EvidenceStore()`, `createMockEvidenceStore()`, etc.                                       |
| **JSDoc with `@example`**                     | `IAuthAdapter` in `auth-adapter.ts`                        | Every new public interface, type, and factory                                                                            |
| **TanStack Query integration**                | Existing `useQuery`/`useMutation` patterns                 | All read hooks use `useQuery` with stable cache keys; writes use `useMutation` with optimistic rollback where applicable |
| **RBAC enforcement**                          | `canAccess()`, `canPerform()` in `src/lib/rbac.ts`         | Approval gates, waivers, and distribution MUST route through existing RBAC, not duplicate role logic                     |
| **NIST compliance**                           | AU-2/AU-3 audit logging, AC-3 access enforcement, AC-5 SoD | Every state transition is audit-logged with actor + reason + timestamp; approval + self-request is blocked               |
| **Readonly config properties**                | `refreshIntervalMs` in `IAuthAdapter`                      | All adapter config interfaces use `readonly`                                                                             |
| **Accessibility**                             | Existing WCAG 2.1 AA + Storybook a11y addon                | All new surfaces keyboard-navigable; screen-reader-announced timers/alerts                                               |
| **Error classification**                      | `api-data-layer-rulebook.md` §4                            | Each primitive surfaces typed errors (`EvidenceImmutabilityError`, `SlaBreachError`, etc.)                               |

## Stories

| Story | Title                                                    | Phase               | Points | Priority |
| ----- | -------------------------------------------------------- | ------------------- | ------ | -------- |
| 28.1  | Immutable Evidence Store — Provider Interface & Adapters | 1 — Foundation      | 8      | P0       |
| 28.2  | Document Completeness Engine — Checklist Primitive       | 1 — Foundation      | 5      | P0       |
| 28.3  | Gated Approval State Machine                             | 1 — Foundation      | 8      | P0       |
| 28.4  | Conditional Approval with SLA Tracking                   | 2 — Exception Mgmt  | 5      | P1       |
| 28.5  | Scoped One-Time Secure Distribution                      | 2 — Delivery        | 5      | P1       |
| 28.6  | Two-Phase Action Confirmation (Chain of Custody)         | 3 — Provenance      | 5      | P2       |
| 28.7  | Inverse Dependency Query — Version → Consumers           | 3 — Impact Analysis | 5      | P2       |

**Total: 41 points across 3 phases.**

## Dependencies

- **Epic 19 (Template — Provider Pluggability)** — Story 19.7 (API client) and Story 19.15 (security/CSP) are sibling foundations; this epic extends the same provider-adapter pattern established there
- **Epic 8 (Audit Trail)** — every state transition in this epic writes AUDIT# records through the existing pipeline
- **Existing RBAC** (`src/lib/rbac.ts`) — approval authority, waiver authority, distribution authority are expressed as new actions in the existing RBAC table, not as a parallel system
- **TanStack Query** — all read/write hooks follow the established pattern

## Out of Scope (Explicitly Deferred)

- **Domain-specific workflow UIs** — this epic delivers primitives and a reference wiring in the firmware flow; building compliance workflows for _other_ domains is downstream template-consumer work
- **Cryptographic evidence signing / notarization chains** — WORM storage is sufficient for the 90% case; cryptographic signing is a Phase 4 stretch (out of scope here)
- **Retention policy lifecycle management UI** — adapters honor retention settings at storage-provider level; a UI to modify retention policies per evidence class is deferred
- **SLA escalation to external systems (PagerDuty, Slack)** — SLA alerts fire as in-app notifications + email; third-party escalation is a downstream integration
- **Blast-radius visualization (graph render)** — Story 28.7 delivers the _query_ primitive and a tabular result UI; a graph/network visualization is deferred
- **Multi-region evidence replication** — single-region immutable storage is sufficient for template; geo-replication is an infrastructure concern
- **Workflow designer / BPMN UI** — the approval state machine in 28.3 is code-configurable; a drag-drop designer is out of scope

## Delivery Sequence

1. **Phase 1 — Foundation (P0):** Stories 28.1, 28.2, 28.3 — the three primitives every subsequent story depends on
2. **Phase 2 — Exception & Delivery (P1):** Stories 28.4, 28.5 — layer on top of Phase 1
3. **Phase 3 — Provenance & Impact (P2):** Stories 28.6, 28.7 — close the chain-of-custody loop and enable impact analysis

## Success Metrics

- Zero IMS/firmware/Sungrow type references in `src/lib/compliance/` public interfaces — verified by import-graph lint
- At least two adapter implementations per primitive (mock + reference cloud), swappable via config without touching call sites
- Reference firmware flow demonstrably uses every primitive end-to-end — auditor walkthrough passes in under 10 minutes
- ≥ 85% unit test coverage on `src/lib/compliance/**` with both adapters exercised
- Storybook surfaces for every new UI primitive (waiver dialog, SLA badge, approval state pill, impact query table)
- Integration contract (`Docs/integration-contract.md`) updated with new env vars and adapter selection matrix

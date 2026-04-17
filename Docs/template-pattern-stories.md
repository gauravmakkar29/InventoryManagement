# Template-Pattern Stories — Index

> **Audience:** Any team adopting this enterprise template — Product Owners, Engineering Leads, Platform Architects.
>
> **Purpose:** Capture the **product-agnostic workflow patterns** that surfaced during discovery (Sungrow / IMS Gen 2, April 17 2026 stand-up) and filter them down to patterns that belong in the **reusable template**, not the Sungrow-specific backlog.
>
> **Scope:** Stories here describe _patterns_, not features of any single product. They use generic language — `entity`, `artifact`, `reviewer`, `operator` — never `firmware`, `inverter`, `device`, or `HBOM`.
>
> **Where they live on GitHub:** Epic 19 (Enterprise Template — Reusable Patterns) on Project #1, Release field set to `Build 4 — Template & Infrastructure`.
>
> **Companion docs:**
>
> - [`Requirement.md`](./Requirement.md) — product-level business requirements (IMS Gen 2 specific)
> - [`Implementation-Plan.md`](./Implementation-Plan.md) — build-cycle delivery plan
> - [`epics/epic-19/`](./epics/epic-19/) — the full story files (`story-19.1.md` … `story-19.11.md`)

---

## Filter rule (how these 11 were selected)

A pattern qualifies as **template-ready** only if all three are true:

1. **Product-agnostic.** The story body contains no references to a specific product, vertical, or entity type (no "firmware", "device", "hardware", "inverter", "HBOM", "SBOM", etc.).
2. **Reusable.** At least two unrelated products could adopt it verbatim (e.g., a fleet-tracking app and a content-moderation platform could both ship the same pattern).
3. **Complete.** The pattern is a _whole workflow_ — not a UI widget or a data model fragment.

**14 candidate patterns** were reviewed. **11 survived** after merging near-duplicates:

- Candidates 4 (waiver-SLA follow-up alert) + 5 (deadline alert on missing prerequisites) → **merged into Story 19.4** (Deadline-watch alerting).
- Candidates 7 + 8 + 9 (access request / approval queue / time-limited grant / auto-expiry) → **merged into Story 19.6** (Scoped access-request lifecycle).

## The 11 patterns

| #     | Story                                                                       | Primary role           | Depends on | Est. points |
| ----- | --------------------------------------------------------------------------- | ---------------------- | ---------- | ----------- |
| 19.1  | [Approval-first entity view](./epics/epic-19/story-19.1.md)                 | Approver               | —          | 8           |
| 19.2  | [Reviewer role with gated status](./epics/epic-19/story-19.2.md)            | Reviewer               | 19.1       | 5           |
| 19.3  | [Artifact waiver — permanent or conditional](./epics/epic-19/story-19.3.md) | Approver, Reviewer     | 19.2       | 5           |
| 19.4  | [Deadline-watch alerting](./epics/epic-19/story-19.4.md)                    | Operator, Approver     | 19.3       | 8           |
| 19.5  | [Inbox-style dashboard landing](./epics/epic-19/story-19.5.md)              | Operator               | 19.4       | 5           |
| 19.6  | [Scoped access-request lifecycle](./epics/epic-19/story-19.6.md)            | Operator, Approver     | —          | 8           |
| 19.7  | [Upgrade-available notification](./epics/epic-19/story-19.7.md)             | Operator               | 19.4       | 5           |
| 19.8  | [Per-category artifact requirement matrix](./epics/epic-19/story-19.8.md)   | Administrator          | —          | 5           |
| 19.9  | [Document immutability on upload](./epics/epic-19/story-19.9.md)            | Administrator, Auditor | —          | 5           |
| 19.10 | [Bulk decision via manifest](./epics/epic-19/story-19.10.md)                | Approver, Operator     | 19.1       | 8           |
| 19.11 | [CRUD foundations for nested tenancy](./epics/epic-19/story-19.11.md)       | Administrator          | —          | 8           |

**Total:** ~70 story points, delivered in **Build 4 (Template & Infrastructure)**.

---

## Patterns deliberately excluded (product-specific, keep in product epics)

For the record — these surfaced in the same discovery session but were rejected as template material because they couple to a specific vertical:

| Excluded                                                          | Why not a template pattern                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Per-device hardware-BOM tracking                                  | Hardware-specific; most template users don't model components                    |
| Hardware-BOM bulk-apply across consignment                        | Same reason                                                                      |
| Catalog vs site-customized entity (golden image / ROM split)      | The "customization per customer" split is specific to OEM hardware supply chains |
| Named-vendor artifact-ingest pipelines                            | Couples to named integrations (HQ → Ignite → IMS path)                           |
| Interim "shadow ingestion" from a specific SaaS source (Airtable) | Vendor-specific                                                                  |
| "New firmware available" scoped to customer + device model        | Covered generically by Story 19.7 (`Upgrade-available notification`)             |

These remain in the Sungrow-specific backlog (Epics 4, 11, 12, 20, 26) — **not** in Epic 19.

---

## How to adopt these in your own project

If you're a team consuming this template:

1. **Read each story** in `Docs/epics/epic-19/`. Each one is self-contained — persona, preconditions, ACs, tech-spec reference, dev checklist.
2. **Pick the ones you need.** Not every product needs every pattern — e.g., a single-tenant internal tool won't need 19.11 (nested tenancy) or 19.6 (access request lifecycle).
3. **Substitute your domain's noun for `entity`.** The stories say "entity" throughout; a firmware-approval app reads it as "firmware", a policy-management app as "policy", a release-management app as "release".
4. **Adapt the ACs** where the template default doesn't fit — but don't weaken the _pattern shape_ (e.g., don't turn 19.3's "permanent + conditional" waiver into just one type; that's the pattern).
5. **Don't re-implement** these from scratch. If the template provides the primitive, use it and extend.

---

## Change log

| Date       | Change                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-04-17 | Initial capture from discovery stand-up (Sungrow IMS Gen 2); 14 candidates → 11 patterns after de-duplication |

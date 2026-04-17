# IMS Gen 2 — Implementation Plan

> **Audience:** Product Owners, Program Managers, Delivery Leads, Engineering Managers
>
> **Purpose:** Show _how_ the business requirements in `Requirement.md` are sequenced into deliverable increments. This document is the bridge between business scope and day-to-day execution in GitHub Projects.
>
> **Companion:** [`Requirement.md`](./Requirement.md) — the business requirements this plan delivers.
>
> **Source of truth for live status:** [GitHub Project #1 — _IMS Gen2 HLM Platform_](https://github.com/users/gauravmakkar29/projects/1). Issue counts, assignees, and status reflect the live board, not this document.

---

## Table of Contents

1. [Delivery Approach](#1-delivery-approach)
2. [Build Cycle Overview](#2-build-cycle-overview)
3. [Requirement → Build → Epic → Story Traceability](#3-requirement--build--epic--story-traceability)
4. [Build 1 — Core Platform](#4-build-1--core-platform)
5. [Build 2 — Advanced Features](#5-build-2--advanced-features)
6. [Build 3 — Enterprise Hardening](#6-build-3--enterprise-hardening)
7. [Build 4 — Template & Infrastructure](#7-build-4--template--infrastructure)
8. [Build 5 — Quality & Resilience](#8-build-5--quality--resilience)
9. [Build 6 — Production Ready](#9-build-6--production-ready)
10. [Cross-Build Dependency Map](#10-cross-build-dependency-map)
11. [Milestones, Releases, Risk Register](#11-milestones-releases-risk-register)

---

## 1. Delivery Approach

### 1.1 Principles

- **Every feature starts with a GitHub Issue** — no code without a story.
- **Stories are functional** (persona-driven acceptance criteria); technical detail lives in per-epic `tech-spec.md`.
- **Build cycles are outcome-driven** — each cycle produces a demonstrable business outcome, not just code.
- **Traceability is bi-directional** — requirement → build → epic → story → PR → test → release.
- **CI gates every merge** — build, unit tests, E2E smoke, security checks.

### 1.2 Cadence

- 2-week iterations (configured as the `Sprint` iteration field on the GitHub Project).
- Multiple iterations roll up into one Build Cycle.
- Each Build Cycle closes with a stakeholder demo, a retrospective, and explicit exit-criteria sign-off.

### 1.3 Artifact locations

> **Heads-up on Build Cycles vs Milestones.** Build cycles ("Build 1 — Core Platform", …) are **NOT** GitHub milestones. They live **only** as options on the `Release` single-select field inside [Project #1](https://github.com/users/gauravmakkar29/projects/1). The repo's [Milestones page](https://github.com/gauravmakkar29/InventoryManagement/milestones) is used exclusively for **epics** (one milestone per epic). To see build-cycle grouping, open the project board and group / filter by the `Release` field.

| Artifact                  | Location                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business requirements     | [`Docs/Requirement.md`](./Requirement.md)                                                                                                           |
| **Build cycles**          | [Project #1](https://github.com/users/gauravmakkar29/projects/1) → `Release` field (6 options: Build 1–6). Not in the Milestones page.              |
| **Epic grouping**         | [GitHub Milestones](https://github.com/gauravmakkar29/InventoryManagement/milestones) — one milestone per epic (Epic 1 … Epic 27).                  |
| Issue / Story tracking    | [Project #1 board](https://github.com/users/gauravmakkar29/projects/1) — sort, filter, and group by Status, Sprint, Priority, Release (build), etc. |
| Story detail (functional) | `Docs/epics/epic-{N}/story-{N.M}.md`                                                                                                                |
| Per-epic tech spec        | `Docs/epics/epic-{N}/tech-spec.md`                                                                                                                  |
| Master brief              | `Docs/IMS-Gen2-Detailed-Project-Brief-For-Terraform.md`                                                                                             |

---

## 2. Build Cycle Overview

IMS Gen 2 is delivered across **six build cycles**. Each cycle builds on the previous one; nothing in a later cycle can run without the capabilities delivered earlier.

| Build | Name                          | Items | Epics             | Theme / Business Outcome                                                                                                                                                         |
| ----- | ----------------------------- | ----: | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Core Platform**             |    43 | 1–6               | Operator can sign in, see the fleet, manage firmware, schedule orders, track compliance, and review an audit trail. The product is _usable end-to-end_ at the end of this build. |
| **2** | **Advanced Features**         |    41 | 7–12              | Executive analytics, full-text search, location intelligence, firmware supply-chain security, and first-class audit query — the product becomes _valuable to leadership_.        |
| **3** | **Enterprise Hardening**      |    84 | 13–18, 25, 26     | Heatmaps, blast-radius, incident isolation, digital twin, theme polish, formal infrastructure, and session-security hardening — the product becomes _enterprise-grade_.          |
| **4** | **Template & Infrastructure** |    52 | 19 (template), 26 | Extract the platform into a reusable enterprise template; formalize secure firmware distribution across tenants.                                                                 |
| **5** | **Quality & Resilience**      |    18 | 21, 22            | Refactor state management and data layer for long-term maintainability and consistent behaviour under load.                                                                      |
| **6** | **Production Ready**          |     5 | 23                | Final design-system consolidation and release-candidate polish for GA.                                                                                                           |

> **Where this lives.** Build cycles are stored as values of the `Release` single-select field on [GitHub Project #1](https://github.com/users/gauravmakkar29/projects/1) — **not** as GitHub Milestones. Open the project, group or filter the board by `Release`, and you'll see the same six-cycle grouping used in this document. The [Milestones page](https://github.com/gauravmakkar29/InventoryManagement/milestones) holds epics only.

---

## 3. Requirement → Build → Epic → Story Traceability

This is the key cross-reference. Every business requirement (`BR-XXX` from [`Requirement.md`](./Requirement.md)) is delivered by a specific epic in a specific build.

| Requirement Group                               | Requirement IDs                            | Build Cycle                     | Epic(s)           |
| ----------------------------------------------- | ------------------------------------------ | ------------------------------- | ----------------- |
| Authentication & Access                         | BR-060 → BR-066                            | Build 1                         | Epic 1            |
| Session & Auth Hardening                        | BR-061, BR-064, BR-066 (hardened)          | Build 3                         | Epic 25           |
| Dashboard & KPIs                                | BR-050 → BR-054                            | Build 1, Build 2                | Epic 2, Epic 7    |
| Executive Summary                               | BR-055                                     | Build 3                         | Epic 16           |
| Device Inventory                                | BR-001 → BR-008                            | Build 1                         | Epic 3            |
| Firmware Lifecycle (core)                       | BR-010 → BR-017                            | Build 1                         | Epic 4            |
| Firmware Security (SoD formal)                  | BR-013, BR-014, BR-016, BR-017             | Build 2                         | Epic 11           |
| Firmware Supply Chain (SBOM)                    | BR-098                                     | Build 2                         | Epic 12           |
| Firmware Distribution (secure, multi-tenant)    | BR-101, BR-102                             | Build 3 / Build 4               | Epic 26           |
| Service Orders                                  | BR-020 → BR-026                            | Build 1                         | Epic 5            |
| Compliance & Vulnerability                      | BR-030 → BR-036                            | Build 1                         | Epic 6            |
| Audit Trail (core)                              | BR-040 → BR-044                            | Build 1                         | Epic 4 (embedded) |
| Audit Trail (formalized)                        | BR-040 → BR-044                            | Build 2                         | Epic 8            |
| Analytics & Reporting                           | BR-050 → BR-055                            | Build 2                         | Epic 7            |
| Geo-Location (static map)                       | BR-006, BR-090                             | Build 2                         | Epic 9            |
| Location Intelligence (interactive, geofencing) | BR-006, BR-090                             | Build 2                         | Epic 10           |
| Global Search                                   | BR-070 → BR-074                            | Build 2                         | Epic 18           |
| Heatmaps & Blast Radius                         | BR-090, BR-091, BR-092                     | Build 3                         | Epic 13           |
| Incident Isolation & Response                   | BR-093, BR-094, BR-095                     | Build 3                         | Epic 14           |
| Digital Twin                                    | BR-096, BR-097                             | Build 3                         | Epic 15           |
| Theme / Connectivity / KPI polish               | BR-055                                     | Build 3                         | Epic 16           |
| Device Lifecycle 360 (passport)                 | BR-099, BR-100                             | Build 3 (Epic 27 where present) | Epic 27           |
| Platform Infrastructure                         | (NFR: availability, scalability, security) | Build 3                         | Epic 17           |
| External Integrations (CRM, Artifact, Scanner)  | BR-101                                     | Build 4                         | Epic 20           |
| Reusable Template                               | (program-level goal)                       | Build 4                         | Epic 19           |
| State Management consolidation                  | NFR: maintainability                       | Build 5                         | Epic 21           |
| Data Layer consolidation                        | NFR: consistency                           | Build 5                         | Epic 22           |
| Performance Optimization                        | NFR: performance                           | Build 5                         | Epic 24           |
| Design System consolidation                     | NFR: UX, accessibility                     | Build 6                         | Epic 23           |

> **How to read this table.** Pick any business requirement in `Requirement.md` → look up its group → see which build delivers it and which epic owns it. Every row ties a promise made in `Requirement.md` to a named deliverable on the GitHub board.

---

## 4. Build 1 — Core Platform

### 4.1 Goal

Deliver a **usable, end-to-end product**: an authenticated operator can see the fleet, manage firmware through a documented approval workflow, schedule service, track compliance, and review an audit trail. By the end of Build 1, the system satisfies every _core-workflow_ requirement in `Requirement.md` §7.1–§7.7.

### 4.2 Exit criteria

- All Epic 1–6 stories are merged and E2E tests pass on the smoke suite.
- Stakeholder demo walks through Auth → Dashboard → Inventory → Firmware → Orders → Compliance with no blockers.
- NIST 800-53 core controls (AC-3, AU-12, IA-2 basic, IA-5) verified.

### 4.3 Epics & stories

#### Epic 1 — Authentication & User Management

_Secure sign-in, RBAC, and session lifecycle for every user._

| Story | Persona     | Outcome                                                  |
| ----- | ----------- | -------------------------------------------------------- |
| 1.1   | Admin       | Log in securely with email and password                  |
| 1.2   | Admin       | Set up multi-factor authentication via TOTP              |
| 1.3   | Ops Manager | Maintain active sessions with automatic token refresh    |
| 1.4   | Admin       | Enforce role-based access control across the platform    |
| 1.5   | Admin       | Create and manage user accounts and group memberships    |
| 1.6   | Ops Manager | Navigate protected routes with a persistent shell layout |

#### Epic 2 — Dashboard & Executive Overview

_Real-time KPI cards, quick actions, and system health at a glance._

| Story | Persona     | Outcome                                              |
| ----- | ----------- | ---------------------------------------------------- |
| 2.1   | Ops Manager | View KPIs to assess fleet health                     |
| 2.2   | Ops Manager | Access quick-action links with pending counts        |
| 2.3   | Admin       | Monitor recent alerts and system status              |
| 2.4   | Ops Manager | Receive real-time notifications in a slide-out panel |
| 2.5   | Ops Manager | Mark notifications as read individually or in bulk   |
| 2.6   | Ops Manager | Refresh dashboard data manually                      |

#### Epic 3 — Inventory & Device Management

_Searchable device catalogue with status filters, firmware view, and map._

| Story | Persona     | Outcome                                            |
| ----- | ----------- | -------------------------------------------------- |
| 3.1   | Ops Manager | Search and filter devices in a sortable data table |
| 3.2   | Ops Manager | View device firmware versions and health scores    |
| 3.3   | Ops Manager | View device locations on an interactive world map  |
| 3.4   | Ops Manager | Filter devices by status on the geographic map     |
| 3.5   | Ops Manager | Export device inventory to CSV                     |
| 3.6   | Ops Manager | Drill down on device details from any view         |

#### Epic 4 — Deployment & Firmware Lifecycle

_Multi-stage firmware approval with separation of duties and audit logging._

| Story | Persona     | Outcome                                              |
| ----- | ----------- | ---------------------------------------------------- |
| 4.1   | Ops Manager | Upload firmware with checksum verification           |
| 4.2   | Ops Manager | Advance firmware through Testing and Approval stages |
| 4.3   | Admin       | Approve firmware with enforced separation of duties  |
| 4.4   | Admin       | Deprecate outdated firmware versions                 |
| 4.5   | Admin       | Search and filter audit logs by date range and user  |

#### Epic 5 — Account & Service Orders

_Kanban order management with calendar view and technician assignment._

| Story | Persona     | Outcome                                              |
| ----- | ----------- | ---------------------------------------------------- |
| 5.1   | Ops Manager | Create new service orders with technician assignment |
| 5.2   | Ops Manager | Manage order status via Kanban drag-and-drop         |
| 5.3   | Ops Manager | View service orders on a monthly calendar            |
| 5.4   | Ops Manager | Filter orders by status, priority, and date range    |
| 5.5   | Ops Manager | Export service orders to CSV                         |

#### Epic 6 — Compliance & Vulnerability Tracking

_Compliance item lifecycle, vulnerability tracking, and regulatory reports._

| Story | Persona            | Outcome                                                        |
| ----- | ------------------ | -------------------------------------------------------------- |
| 6.1   | Ops Manager        | Track compliance status per firmware version and certification |
| 6.2   | Ops Manager        | View vulnerabilities linked to compliance items                |
| 6.3   | Ops Manager        | Update vulnerability remediation status                        |
| 6.4   | Admin              | Approve or deprecate compliance items                          |
| 6.5   | Ops Manager        | Generate regulatory reports in CSV / JSON                      |
| 6.6   | Compliance Auditor | Filter vulnerabilities by severity and remediation status      |

### 4.4 Demoable outcome

Executive walks into the office, signs in, looks at a map of 1,000 devices, drills into one, sees its firmware, views the approval chain, pulls up the compliance report, and exports the audit trail.

---

## 5. Build 2 — Advanced Features

### 5.1 Goal

Elevate the product from _usable_ to _valuable_ for leadership. Add executive analytics, cross-entity search, location intelligence, formal audit, firmware supply-chain security, and a first-class Aegis firmware-security pipeline.

### 5.2 Exit criteria

- Executive dashboard renders live KPIs with time-range filtering.
- Global search returns sub-second results across all entities.
- Formal SBOM upload and CVE matching workflow works end-to-end.
- Location-aware features (geofencing, map clustering) demonstrated.

### 5.3 Epics & stories

#### Epic 7 — Analytics & Reporting

_Executive analytics with KPI cards, charts, and time-range filtering._

| Story | Persona     | Outcome                                                 |
| ----- | ----------- | ------------------------------------------------------- |
| 7.1   | Ops Manager | View 5 key metrics via KPI cards with trend indicators  |
| 7.2   | Ops Manager | Visualize device status and compliance trends as charts |
| 7.3   | Ops Manager | Filter analytics by time range (7d / 30d / 90d)         |
| 7.4   | Ops Manager | Export audit-log data for compliance reporting          |
| 7.5   | Ops Manager | View system performance metrics in a dashboard          |

#### Epic 8 — Audit Trail (formalized)

_Immutable, queryable audit logging with role-based access._

| Story | Persona | Outcome                                                     |
| ----- | ------- | ----------------------------------------------------------- |
| 8.1   | Admin   | View audit logs for a date range with user / action filters |
| 8.2   | Admin   | Export audit logs to CSV                                    |
| 8.3   | Admin   | Search audit logs by user, resource, or timestamp           |

#### Epic 9 — Geo-Location Formalization

_Static world map with device clustering and status filtering._

| Story | Persona     | Outcome                                           |
| ----- | ----------- | ------------------------------------------------- |
| 9.1   | Ops Manager | Plot devices on a world map by coordinates        |
| 9.2   | Ops Manager | Filter map view by device status                  |
| 9.3   | Ops Manager | Hover / click a marker for summary detail         |
| 9.4   | Ops Manager | Resolve device coordinates from location names    |
| 9.5   | Ops Manager | Access map from Inventory without page navigation |

#### Epic 10 — Location Intelligence

_Interactive map with geofencing, real-time tracking, and clustering._

| Story | Persona     | Outcome                                         |
| ----- | ----------- | ----------------------------------------------- |
| 10.1  | Ops Manager | Interactive zoomable map with pan / rotate      |
| 10.2  | Ops Manager | Search locations by name                        |
| 10.3  | Ops Manager | Create and visualize geofence boundaries        |
| 10.4  | Ops Manager | View device movement trail and position history |
| 10.5  | Ops Manager | Receive geofence enter / exit alerts            |
| 10.6  | Ops Manager | Cluster markers in dense areas for performance  |

#### Epic 11 — Aegis Phase 1 (Firmware Security)

_Formal firmware approval pipeline with SoD, vulnerability tracking, regulatory reporting._

| Story | Persona     | Outcome                                              |
| ----- | ----------- | ---------------------------------------------------- |
| 11.1  | Ops Manager | Upload firmware and see SoD tracking                 |
| 11.2  | Admin       | Enforce separation of duties through approval stages |
| 11.3  | Ops Manager | Manage vulnerabilities linked to firmware            |
| 11.4  | Ops Manager | Generate regulatory compliance reports               |
| 11.5  | Ops Manager | View firmware version history with approval chain    |
| 11.6  | Admin       | Trigger security review for high-risk firmware       |
| 11.7  | Ops Manager | View detailed firmware metadata                      |

#### Epic 12 — SBOM & Supply Chain Security

_Software bill of materials parsing, component tracking, CVE matching, license compliance._

| Story | Persona     | Outcome                                                  |
| ----- | ----------- | -------------------------------------------------------- |
| 12.1  | Ops Manager | Upload CycloneDX / SPDX SBOM files                       |
| 12.2  | Ops Manager | View components and dependencies extracted from SBOM     |
| 12.3  | Ops Manager | Track CVEs affecting each component                      |
| 12.4  | Ops Manager | Review license compliance; flag non-compliant components |
| 12.5  | Ops Manager | Update component remediation status                      |
| 12.6  | Ops Manager | Export SBOM analysis in CSV / JSON                       |

### 5.4 Demoable outcome

The COO opens the Executive Summary, filters to last 30 days, sees the vulnerability trend, drills into the top CVE, clicks one component, and sees every device running it — all in under 60 seconds.

---

## 6. Build 3 — Enterprise Hardening

### 6.1 Goal

Make IMS Gen 2 **enterprise-grade**: heatmaps, blast-radius modelling, incident isolation, digital twin, hardened sessions, formal infrastructure-as-code, and a polished UI. This is the biggest build (84 items, ~10 epics).

### 6.2 Exit criteria

- Heatmap and blast-radius workflows complete.
- Incident can be opened, scoped, quarantined, and closed end-to-end.
- Digital twin simulates a firmware upgrade and predicts impact.
- Infrastructure reproducible to dev / staging / production from code.
- Session-security hardening review passes.

### 6.3 Epics & stories

#### Epic 13 — Environmental Heatmaps & Blast Radius

| Story | Persona     | Outcome                                             |
| ----- | ----------- | --------------------------------------------------- |
| 13.1  | Ops Manager | View heatmap of device health / risk across regions |
| 13.2  | Ops Manager | Filter heatmap by risk threshold                    |
| 13.3  | Ops Manager | Calculate blast radius of a failure                 |
| 13.4  | Ops Manager | Simulate what-if failure scenarios                  |
| 13.5  | Ops Manager | View historical simulation results                  |
| 13.6  | Ops Manager | Ingest telemetry and compute risk in real time      |

#### Epic 14 — Incident Isolation & Lateral Movement

| Story | Persona     | Outcome                                                |
| ----- | ----------- | ------------------------------------------------------ |
| 14.1  | Admin       | Create and manage incidents with severity / category   |
| 14.2  | Admin       | Isolate affected devices to stop lateral movement      |
| 14.3  | Ops Manager | View network topology of device relationships          |
| 14.4  | Ops Manager | Analyze lateral-movement risk                          |
| 14.5  | Admin       | Execute incident response playbooks with step tracking |
| 14.6  | Ops Manager | View incident timeline with all status changes         |

#### Epic 15 — Digital Twin

| Story | Persona     | Outcome                                                 |
| ----- | ----------- | ------------------------------------------------------- |
| 15.1  | Ops Manager | View twin with composite health score and trend         |
| 15.2  | Ops Manager | Simulate firmware upgrade impact before deployment      |
| 15.3  | Ops Manager | Detect and resolve configuration drift                  |
| 15.4  | Ops Manager | Replay device state at any historical timestamp         |
| 15.5  | Ops Manager | View health factor breakdown and predicted failure date |

#### Epic 16 — Dual-Theme UI, Connectivity & KPI

| Story | Persona     | Outcome                                               |
| ----- | ----------- | ----------------------------------------------------- |
| 16.1  | Any User    | Toggle between light and dark themes (persistent)     |
| 16.2  | Ops Manager | Monitor connectivity and latency of platform services |
| 16.3  | Ops Manager | See alerts when services become degraded              |
| 16.4  | Admin       | View Executive Summary for client presentations       |
| 16.5  | Admin       | Export Executive Summary as PNG / PDF                 |
| 16.6  | Ops Manager | Access KPI dashboard with server-side aggregations    |

#### Epic 17 — Platform Infrastructure

| Story | Persona | Outcome                                                  |
| ----- | ------- | -------------------------------------------------------- |
| 17.1  | DevOps  | Provision all cloud resources reproducibly               |
| 17.2  | DevOps  | Deploy to dev / staging / production                     |
| 17.3  | DevOps  | Configure env-specific settings (MFA / WAF / encryption) |
| 17.4  | DevOps  | Monitor infra health via dashboards and alerts           |
| 17.5  | DevOps  | CI / CD pipeline with automated testing and deployment   |
| 17.6  | DevOps  | Manage infra state with locking                          |

#### Epic 18 — OpenSearch & Global Search

| Story | Persona     | Outcome                                                |
| ----- | ----------- | ------------------------------------------------------ |
| 18.1  | Any User    | Search across all entities via Cmd+K                   |
| 18.2  | Any User    | Filter search results by entity type                   |
| 18.3  | Ops Manager | Device-scoped search with status / location filters    |
| 18.4  | Ops Manager | Search vulnerabilities by CVE / severity / component   |
| 18.5  | Ops Manager | Request server-side aggregations for KPIs              |
| 18.6  | Ops Manager | Execute geospatial queries (distance / bbox / heatmap) |

#### Epic 25 — Auth & Session Security Hardening

_Formal session lifecycle, token rotation, MFA enforcement in production, brute-force throttling._ 6 stories tracked in GitHub Project.

#### Epic 26 — Secure Firmware Distribution & Version Audit Trail

_One-time download links, tenant-scoped distribution, complete version audit history._ Story set spans Build 3 and Build 4.

#### Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline

_Device passport — ownership chain, firmware timeline, persona-aware filtering._

| Story | Persona     | Outcome                                                           |
| ----- | ----------- | ----------------------------------------------------------------- |
| 27.1  | Ops Manager | View complete lifecycle timeline from registration → decommission |
| 27.2  | Ops Manager | Filter timeline by persona (Admin / Technician / Customer)        |
| 27.3  | Ops Manager | Trace ownership / custody chain through transfers                 |
| 27.4  | Ops Manager | View firmware approval comments and rollback reasons              |
| 27.5  | Ops Manager | Track device status transitions with reasons                      |

### 6.4 Demoable outcome

A critical CVE is disclosed. The Admin opens an incident, the system shows the 380 devices affected, quarantines them, runs the response playbook, and produces an evidence pack — in under 10 minutes.

---

## 7. Build 4 — Template & Infrastructure

### 7.1 Goal

Extract the IMS platform into a **reusable enterprise template** so that future product lines can be stood up in weeks, not quarters. Formalize secure, multi-tenant firmware distribution.

### 7.2 Exit criteria

- Template scaffolding reproduces a working dev environment from scratch.
- Pluggable provider pattern (artifact / CRM / scanner / DNS) works against real external systems.
- Secure firmware distribution covers tenant-scoped links and complete version audit.

### 7.3 Epics & stories

#### Epic 19 — Reusable Enterprise Template

_Extracted scaffolding: auth, API, session, observability, CI/CD, infra-as-code, UX primitives — portable to new product lines._ Delivered as ~49 template / scaffolding items on the board.

#### Epic 20 — Pluggable External Integrations & Firmware Lifecycle

| Story | Persona     | Outcome                                                |
| ----- | ----------- | ------------------------------------------------------ |
| 20.1  | DevOps      | Define and implement an Artifact Provider interface    |
| 20.2  | DevOps      | Integrate multiple artifact sources as providers       |
| 20.3  | DevOps      | Define and implement a CRM Provider interface          |
| 20.4  | Ops Manager | Route firmware approvals to external change-management |
| 20.5  | DevOps      | Integrate compliance scanner providers                 |
| 20.6  | Ops Manager | View complete firmware version timeline                |
| 20.7  | Ops Manager | Associate firmware versions with customers / sites     |
| 20.8  | DevOps      | Stream change-data events to external systems          |
| 20.9  | Ops Manager | Generate secure one-time download links                |
| 20.10 | DevOps      | Support multiple DNS providers                         |

#### Epic 26 (continued) — Secure Firmware Distribution & Version Audit Trail

_Remaining tenant-scoped distribution, per-customer access policy, and cross-tenant audit continuity._

### 7.4 Demoable outcome

A new product line is bootstrapped from the template: auth, dashboards, inventory, and firmware pipeline running against the team's own cloud account in one afternoon.

---

## 8. Build 5 — Quality & Resilience

### 8.1 Goal

Pay down the architectural debt accumulated during rapid feature delivery. Stabilize state management and the data layer so that future changes are _safe, fast, and predictable_.

### 8.2 Exit criteria

- Single, consistent state-management pattern across the app.
- Single, consistent data-access pattern; no one-off queries left.
- Performance budgets enforced in CI; no regressions in the top 10 user flows.

### 8.3 Epics & stories

#### Epic 21 — State Management Refactor

_Consolidate to a single state-management approach across every page._ 8 stories on the board — scoped after Build 2 feedback.

#### Epic 22 — Data Layer & API Integration

_Single data-access pattern, consistent caching, error classification, and pagination._ 10 stories on the board.

#### Epic 24 — Performance Optimization (rollup)

_Enforce bundle budgets, memoization rules, virtualization for long lists, and animation performance._ Tracked under Milestone 19 on GitHub.

### 8.4 Demoable outcome

Side-by-side perf test: Build 2 vs Build 5. All ten flagship pages hit p95 page-interactive under 2.5 seconds; zero state-related defects opened in the last iteration.

---

## 9. Build 6 — Production Ready

### 9.1 Goal

Final polish: consolidate the design system, resolve any accessibility gaps, close all P0 / P1 defects, and stamp the Release Candidate for General Availability.

### 9.2 Exit criteria

- Design system has one canonical component per concern; no drift.
- WCAG 2.1 AA audit passes on all 10 primary pages.
- Zero open P0 defects; zero open P1 defects older than one iteration.
- GA sign-off from Product, Engineering, and Security leads.

### 9.3 Epics & stories

#### Epic 23 — Component Design System & UI Primitives

_Canonical primitives (Button, Input, Table, Card, Modal) with documented props, variants, and accessibility contracts._ 5 stories (and 1 spillover from Build 3) tracked on the board.

### 9.4 Demoable outcome

The Release Candidate build is signed off and promoted. A customer onboards against the production environment end-to-end with no blockers.

---

## 10. Cross-Build Dependency Map

```
                       ┌─ Build 1 ─┐
                       │  Core     │──────┐
                       │  Platform │      │
                       └───────────┘      │
                              │           │
                              ▼           ▼
                  ┌─ Build 2 ──────────────────────┐
                  │ Analytics · Search · Location  │
                  │ SBOM · Aegis · Audit formal    │
                  └────────────────────────────────┘
                              │
                              ▼
       ┌──────────────── Build 3 ─────────────────────┐
       │ Heatmaps · Incident · Twin · Infra · Hardening│
       └──────────────────────────────────────────────┘
               │                    │
               ▼                    ▼
       ┌── Build 4 ──┐      ┌── Build 5 ──┐
       │ Template &  │      │ Quality &   │
       │ Integrations│      │ Resilience  │
       └─────────────┘      └─────────────┘
                                 │
                                 ▼
                          ┌── Build 6 ──┐
                          │ Production  │
                          │ Ready (GA)  │
                          └─────────────┘
```

### Key dependency rules

1. **Nothing ships without Build 1.** Auth, RBAC, Inventory, Firmware Lifecycle, Service Orders, and the audit spine are foundational.
2. **Build 2 is sequential on Build 1.** Analytics reads Build-1 entities; global search indexes Build-1 data; SBOM extends Build-1 firmware.
3. **Build 3 depends on Build 2.** Blast radius reads vulnerability data (Build 2). Incident isolation reads device topology. Digital twin consumes firmware history.
4. **Build 4 is partially parallelizable with Build 3.** The template extraction can begin once Build 2 closes; integration providers must wait for Build 3's firmware-distribution work.
5. **Build 5 follows all feature builds.** Refactors cannot be planned until the surface area stops changing.
6. **Build 6 is a gate, not a phase.** It resolves only _after_ every earlier build closes.

---

## 11. Milestones, Releases, Risk Register

### 11.1 Release stages

| Release                       | Backed By      | Promise                                                               |
| ----------------------------- | -------------- | --------------------------------------------------------------------- |
| **Alpha**                     | End of Build 1 | Internal demo; core workflows functional end-to-end                   |
| **Beta**                      | End of Build 2 | Design-partner pilot; executive dashboard + search + SBOM live        |
| **Enterprise Preview**        | End of Build 3 | Enterprise prospects can evaluate incident / heatmap / infra maturity |
| **RC (Release Candidate)**    | End of Build 5 | Production candidates; perf + resilience verified                     |
| **GA (General Availability)** | End of Build 6 | Public launch                                                         |

### 11.2 Risk register (build-level)

| Build | Risk                                                        | Mitigation                                                                             |
| ----- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1     | Auth / RBAC mis-scoped → rework touches every later feature | Security-review checkpoint at story 1.4; end-to-end role tests before Build 2 opens    |
| 1     | Firmware SoD bypassable                                     | SoD enforcement written and tested before story 4.3 closes; compliance dry-run         |
| 2     | Search performance poor at scale                            | Load-test with 50K records before Build 3 opens                                        |
| 2     | SBOM formats vary wildly                                    | Pilot with one real customer SBOM at each of CycloneDX and SPDX before 12.2            |
| 3     | Infrastructure-as-code drift between environments           | All environments reproduced from the same source; parity test in CI                    |
| 3     | Incident response playbooks too rigid                       | Playbook model is data-driven, not hard-coded; edit-in-UI from day one                 |
| 4     | External provider integrations block core path              | Providers are _pluggable_ — the platform works without them; integrations are additive |
| 5     | Refactor introduces regressions                             | Freeze feature work during Build 5; full E2E regression each sprint                    |
| 6     | Last-mile accessibility gaps                                | WCAG audit scheduled _during_ Build 5, not at the end of Build 6                       |

### 11.3 How this document stays accurate

- **Source of truth for live status is GitHub** — this document captures structure and intent, not day-to-day progress.
- Any change to the build-cycle boundaries, epic membership, or scope must be reflected here **and** on the Project `Release` field — otherwise traceability breaks.
- Every iteration's retrospective asks: "does the build-cycle plan still reflect reality?" If not, this file is updated before the next sprint.

---

_End of Implementation Plan._
_For the business context behind each build, see [`Requirement.md`](./Requirement.md)._
_For live status, see [GitHub Project #1](https://github.com/users/gauravmakkar29/projects/1)._

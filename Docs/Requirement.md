# IMS Gen 2 — Business Requirements Document

> **Audience:** Product Owners, Product Managers, Business Analysts, Customer Stakeholders, Compliance Leads
>
> **Purpose:** This document states _what_ IMS Gen 2 delivers and _why_, in purely business terms. It is the single source of truth for product decisions, scope conversations, and acceptance negotiation. It contains **no** technology, architecture, API, or implementation detail — those live in per-epic tech specs.
>
> **Companion Document:** `Implementation-Plan.md` — shows how the business requirements below are mapped to build cycles, epics, and stories.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Problem Statement](#2-business-context--problem-statement)
3. [Users & Personas](#3-users--personas)
4. [Business Goals & Success Metrics](#4-business-goals--success-metrics)
5. [Scope — In (Gen 2 Commits To)](#5-scope--in-gen-2-commits-to)
6. [Scope — Out / Deferred](#6-scope--out--deferred)
7. [Functional Requirements](#7-functional-requirements)
8. [Business Rules & Policies](#8-business-rules--policies)
9. [Non-Functional Expectations](#9-non-functional-expectations)
10. [Assumptions, Dependencies, Risks](#10-assumptions-dependencies-risks)
11. [Glossary](#11-glossary)

---

## 1. Executive Summary

**IMS Gen 2** (Inventory Management System, Generation 2) is an enterprise **Hardware Lifecycle Management platform** that gives equipment-centric organizations end-to-end control over large, distributed device fleets.

In one place, it lets operations teams **track every device**, **deploy firmware safely** through multi-step approval gates, **prove regulatory readiness** with an immutable audit trail, **respond to incidents** with quarantine and blast-radius analysis, and **schedule field service** against a shared calendar and Kanban board — all while enforcing strict access controls and tenant data isolation.

It replaces the spreadsheets, ticket threads, and fragmented tools that today leave organizations blind to their own fleet, at risk of unsafe firmware rollouts, and unprepared for audits.

---

## 2. Business Context & Problem Statement

### Who this is for

Manufacturers and service providers responsible for distributed hardware — solar inverters, industrial IoT, networked energy equipment, connected appliances — where firmware safety, regulatory certification, and operational visibility are material to revenue and liability.

### The pain today

- **Visibility gaps.** No single system answers "how many devices do we have, where are they, which firmware do they run, and which are healthy?"
- **Unsafe firmware rollouts.** Firmware is pushed without a documented review trail, creating security exposure and regulatory risk.
- **Audit scramble.** Compliance evidence is manually assembled from emails, spreadsheets, and ad-hoc exports. Auditors flag gaps.
- **Incident response is slow.** When a critical vulnerability is disclosed, operations cannot quickly answer "which of our devices are affected?"
- **Field execution drift.** Technicians don't know their assignments in real time; managers cannot see live progress; SLAs slip.

### The commitment of Gen 2

Close every one of those gaps with a single web platform designed for enterprise rigor — authority, compliance, and operator efficiency — not consumer polish.

---

## 3. Users & Personas

| Persona    | Role                    | Primary Goals                                                         | Key Pain Points                                                                        |
| ---------- | ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Sarah**  | Platform Admin          | System oversight; enforce firmware governance; manage users and roles | Manual approval workflows; no automated separation-of-duties; audit evidence scattered |
| **Raj**    | Operations Manager      | Coordinate schedules; track SLAs; report fleet health to customers    | No real-time device visibility; cannot see team workload or job status live            |
| **Mike**   | Field Technician        | Execute assigned service orders; update status in the field           | No mobile-friendly job queue; slow to report completion                                |
| **Lisa**   | Compliance Auditor      | Prove regulatory readiness; track CVEs; produce audit reports         | Exports scattered across tools; vulnerability data is manual                           |
| **Chen**   | Customer Admin (tenant) | Monitor own organization's fleet health and orders                    | Cannot self-serve data; must request reports from the vendor                           |
| **DevOps** | Infrastructure Engineer | Reliable environments, safe releases, zero-downtime deploys           | Manual environment setup; drift between dev, staging, and production                   |

---

## 4. Business Goals & Success Metrics

| #   | Goal                                                            | Measurable Outcome                                                                                             |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| G1  | **Operational efficiency** — shrink field-issue resolution time | –40% mean time to resolve (MTTR) within 6 months of launch                                                     |
| G2  | **Regulatory risk mitigation** — every change auditable         | 100% of create/update/delete actions captured in the audit trail; evidence available within 1 hour of request  |
| G3  | **Firmware safety** — zero unauthorized deploys                 | 0 firmware versions reaching "Approved" without passing through the enforced review chain                      |
| G4  | **Platform reliability** — always-on for operations teams       | 99.9% uptime; recovery target under 1 hour; data-loss window under 5 minutes                                   |
| G5  | **Scalability** — grow with customers                           | Support up to 50,000 devices, 500 concurrent users, 5,000 service orders/month without performance degradation |
| G6  | **Self-service reduces support load**                           | 30% reduction in compliance-report support tickets by month 6                                                  |
| G7  | **Release cadence**                                             | Features shipped every 2 weeks with zero downtime                                                              |
| G8  | **Customer retention**                                          | Enable CustomerAdmin self-service to drive renewal and expansion                                               |

---

## 5. Scope — In (Gen 2 Commits To)

Gen 2 delivers nine business capability areas. Each area is elaborated in Section 7.

1. **Device Inventory & Asset Tracking** — catalog, search, filter, map, export.
2. **Firmware Lifecycle Management** — upload, review, approval, deprecation with enforced separation of duties.
3. **Service Order Management** — creation, Kanban execution, calendar scheduling, CSV export.
4. **Compliance & Vulnerability Tracking** — certifications, CVE tracking, regulatory reports.
5. **Audit Trail** — immutable record of every change, searchable and exportable.
6. **Analytics & Executive Reporting** — dashboards, KPI cards, trend charts, exportable executive summary.
7. **Authentication & Access Control** — RBAC, MFA, session policy, tenant isolation.
8. **Global Search & Command Palette** — full-text discovery across every entity.
9. **Enterprise UX** — themes, responsive layout, accessibility, notifications, keyboard-centric workflows.

Advanced capabilities (heatmaps, incident isolation, digital twin, supply-chain/SBOM analysis, enterprise integrations, lifecycle 360) are also in Gen 2 scope, delivered in later build cycles — see `Implementation-Plan.md` for the sequencing.

---

## 6. Scope — Out / Deferred

The following are **explicitly out** of the Gen 2 release window:

- **Offline-first** operation (continuous internet connectivity is assumed).
- **Native mobile apps** — mobile support is via the responsive web app only.
- **Multi-region active-active** — Gen 2 runs in a single primary region.
- **Third-party productivity integrations** (Slack, PagerDuty, Jira, email-to-ticket). Placeholder only.
- **ISO 27001 / SOC 2 certification tracking** — Gen 2 targets NIST 800-53 as the primary compliance frame.
- **AI-driven predictive maintenance** beyond the basic health-score trend.
- **Customer billing / invoicing / monetization** modules.
- **Public-facing customer portal** beyond the CustomerAdmin view.

---

## 7. Functional Requirements

Requirements are numbered `BR-XXX`. Each is written in user-value form — _"Users must be able to [capability] so that [business outcome]."_

### 7.1 Device Inventory

| ID     | Requirement                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| BR-001 | Users must be able to create, edit, and delete device records so that the fleet record remains accurate.                            |
| BR-002 | Users must be able to search devices by name, serial number, or model so that they can locate any device in seconds.                |
| BR-003 | Users must be able to filter devices by status (Online, Offline, Maintenance) so that they can isolate problem equipment.           |
| BR-004 | Users must be able to filter devices by customer and location so that multi-tenant and regional views are possible.                 |
| BR-005 | Users must be able to view device health scores at a glance so that they can prioritize maintenance.                                |
| BR-006 | Users must be able to view the full device fleet on an interactive world map so that they understand geographic distribution.       |
| BR-007 | Users must be able to export any filtered device list to CSV so that they can share it with customers, auditors, or internal teams. |
| BR-008 | Users must be able to drill into a single device from any view (table, grid, map) to see complete detail.                           |

### 7.2 Firmware Lifecycle

| ID     | Requirement                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-010 | Users must be able to upload firmware packages with version, target model, and integrity checksum so that every release is identifiable.                |
| BR-011 | Users must be able to view all firmware grouped by status (Active, Deprecated, In Review) so that they understand deployment readiness.                 |
| BR-012 | Authorized users must be able to advance firmware through review stages — Uploaded → Testing → Approved — so that every release is explicitly reviewed. |
| BR-013 | The platform must enforce that no single person can upload, test, and approve the same firmware — these three roles must be different individuals.      |
| BR-014 | Users must be able to see _who_ uploaded, tested, and approved each firmware version so that accountability is unambiguous.                             |
| BR-015 | Authorized users must be able to deprecate firmware so that legacy versions are flagged as no longer recommended.                                       |
| BR-016 | Uploaded firmware files must be stored such that they cannot be modified after upload — only read or archived.                                          |
| BR-017 | Users must be able to view approval progress as a visual stage indicator so that workflow state is obvious at a glance.                                 |

### 7.3 Service Orders

| ID     | Requirement                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| BR-020 | Managers must be able to create service orders with technician, type, location, date, time, and priority.                  |
| BR-021 | Technicians must be able to view their own assigned service orders so that they know their schedule.                       |
| BR-022 | Technicians must be able to update order status via drag-and-drop on a Kanban board (Scheduled → In Progress → Completed). |
| BR-023 | Managers must be able to view service orders on a monthly calendar so that conflicts and gaps are visible.                 |
| BR-024 | Users must be able to filter orders by status, technician, priority, and date range.                                       |
| BR-025 | Users must be able to export service orders to CSV.                                                                        |
| BR-026 | Technicians must be notified the moment they are assigned a new order so that no job sits unseen.                          |

### 7.4 Compliance & Vulnerability

| ID     | Requirement                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-030 | Users must be able to create compliance records linking a firmware version and device model to a certification type (e.g., IEC 62109).              |
| BR-031 | Users must be able to submit compliance items for review so that an Admin can approve or reject.                                                    |
| BR-032 | Admins must be able to approve or deprecate compliance items.                                                                                       |
| BR-033 | Users must be able to record vulnerabilities (CVE ID, severity, affected component, remediation status) against compliance records.                 |
| BR-034 | Users must be able to filter vulnerabilities by severity and remediation status so that they can focus on the most critical unresolved items.       |
| BR-035 | Users must be able to generate **regulatory readiness reports** in CSV and JSON so that auditors can ingest evidence directly.                      |
| BR-036 | Users must be able to search vulnerabilities globally by CVE ID or component name so that they can answer "which devices are affected?" in minutes. |

### 7.5 Audit Trail

| ID     | Requirement                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| BR-040 | Every create, update, and delete action must be automatically logged with timestamp, user, affected resource, and action type. |
| BR-041 | Authorized users must be able to query audit logs by date range, user, and resource type.                                      |
| BR-042 | Audit logs must be **immutable** — no user, including Admins, may delete entries.                                              |
| BR-043 | Audit logs must be retained for 90 days, then auto-purged, so that the retention policy is enforced automatically.             |
| BR-044 | Users must be able to export audit logs to CSV so that evidence can be attached to formal audit reports.                       |

### 7.6 Analytics & Reporting

| ID     | Requirement                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-050 | Users must be able to see a dashboard of top-level KPIs — total devices, online devices, active deployments, pending approvals — so that fleet health is readable in seconds. |
| BR-051 | Users must be able to see device status distribution and compliance status distribution as chart visualizations.                                                              |
| BR-052 | Users must be able to see deployment trends over time (weekly and monthly).                                                                                                   |
| BR-053 | Users must be able to see the top vulnerabilities ranked by prevalence so that patching is prioritized.                                                                       |
| BR-054 | Users must be able to filter every analytic by time range (7, 30, 90 days).                                                                                                   |
| BR-055 | Admins must be able to generate and export an **Executive Summary** suitable for board- and customer-level presentations.                                                     |

### 7.7 Authentication & Authorization

| ID     | Requirement                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-060 | Users must be able to sign in with email and password.                                                                                            |
| BR-061 | Users must be able to enable multi-factor authentication so that their account is protected from credential theft.                                |
| BR-062 | Admins must be able to assign users to one of five roles — Admin, Manager, Technician, Viewer, CustomerAdmin — so that access is least-privilege. |
| BR-063 | The platform must enforce role-specific permissions across every page and action.                                                                 |
| BR-064 | Sessions must auto-expire after 15 minutes of inactivity so that unattended terminals cannot be exploited.                                        |
| BR-065 | Customers (CustomerAdmin role) must only see data belonging to their own organization — cross-tenant leakage is a P0 defect.                      |
| BR-066 | Admins must be able to create, enable, disable, and assign roles to user accounts.                                                                |

### 7.8 Global Search

| ID     | Requirement                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| BR-070 | Users must be able to open a global search palette via a universal keyboard shortcut from anywhere in the app.             |
| BR-071 | Users must be able to search across devices, firmware, service orders, compliance items, and vulnerabilities in one query. |
| BR-072 | Users must see partial-match / fuzzy results so that small typos do not block discovery.                                   |
| BR-073 | Search results must be grouped by entity type and show instant suggestions as the user types.                              |
| BR-074 | Search results must highlight matching keywords so that relevance is visible.                                              |

### 7.9 Notifications

| ID     | Requirement                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| BR-080 | The platform must notify Admins and Managers when firmware completes approval so that deployment readiness is broadcast. |
| BR-081 | The platform must notify a technician the instant they are assigned a service order.                                     |
| BR-082 | The platform must notify Managers when an order is completed so that downstream handoffs can happen in real time.        |
| BR-083 | The platform must notify Admins and Managers when a critical-severity vulnerability is published.                        |
| BR-084 | The platform must notify relevant users when a device goes offline.                                                      |
| BR-085 | The platform must show a bell icon with unread count and open a slide-out panel so notifications are ambient.            |
| BR-086 | Clicking a notification must deep-link to the originating entity so that action is one click away.                       |

### 7.10 Advanced Operations (Later Build Cycles)

| ID     | Requirement                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-090 | Users must be able to view device fleet health as a geographic heatmap so that regional risk is readable at a glance.                                                   |
| BR-091 | Users must be able to calculate **blast radius** — the set of devices affected by a specific vulnerability or failure — so that incident scope is known.                |
| BR-092 | Users must be able to simulate "what-if" failure scenarios so that incident response is rehearsed, not improvised.                                                      |
| BR-093 | Admins must be able to open an **incident record**, classify severity, and quarantine affected devices so that lateral movement is stopped.                             |
| BR-094 | Users must be able to view network topology showing device relationships so that dependencies and impact are visible.                                                   |
| BR-095 | Admins must be able to attach a **response playbook** to an incident, execute steps, and track completion.                                                              |
| BR-096 | Users must be able to view a **Digital Twin** — a virtual replica of a device — to simulate firmware upgrades before rolling out.                                       |
| BR-097 | Users must be able to view a **composite health score** with a predicted failure date so that preventive maintenance is possible.                                       |
| BR-098 | Users must be able to upload an **SBOM** (Software Bill of Materials) and see every component, dependency, and license flagged against known vulnerabilities.           |
| BR-099 | Users must be able to view a **complete device passport** — registration → ownership changes → firmware history → service events → decommission — as a single timeline. |
| BR-100 | Users must be able to filter the device timeline by persona (Admin, Technician, Customer) so that each audience sees what is relevant to them.                          |
| BR-101 | Admins must be able to route firmware approvals to an external change-management system so that enterprise change control is respected.                                 |
| BR-102 | Admins must be able to generate secure, one-time firmware download links so that distribution is controlled and auditable.                                              |

---

## 8. Business Rules & Policies

### 8.1 Firmware Governance (Separation of Duties)

- **BP-01** No person may both upload and approve the same firmware version.
- **BP-02** No person may both test and approve the same firmware version.
- **BP-03** Firmware cannot skip from "Uploaded" directly to "Approved" — the "Testing" stage is mandatory.
- **BP-04** Only the Admin role can set the final approval decision.

### 8.2 Audit Immutability & Retention

- **BP-10** Audit log entries cannot be deleted by any role under any condition.
- **BP-11** Audit log retention is 90 days, after which records are automatically purged.
- **BP-12** Every audit entry must capture user identity, action, resource type, resource ID, and timestamp.

### 8.3 Service Order Policy

- **BP-20** Only Managers can create or reassign service orders.
- **BP-21** A service order's scheduled date cannot be in the past at creation time.
- **BP-22** Only the assigned Technician may update the status of their own order (Manager override allowed).

### 8.4 Compliance Policy

- **BP-30** Compliance items follow a one-way transition: **Pending → Approved** or **Pending → Deprecated**.
- **BP-31** Only Admins may approve compliance items.
- **BP-32** Deprecated compliance items are excluded from active compliance dashboards.

### 8.5 Vulnerability Remediation Policy

- **BP-40** Every recorded vulnerability must carry a severity (Critical, High, Medium, Low).
- **BP-41** Remediation status must be one of: Open, In Progress, Resolved.
- **BP-42** When remediation transitions to Resolved, the resolution timestamp is auto-captured.

### 8.6 Multi-Tenant Isolation

- **BP-50** Every device, order, and compliance record carries a Customer ID.
- **BP-51** Queries are scoped to the authenticated user's Customer ID — cross-tenant access is prohibited.
- **BP-52** A CustomerAdmin cannot escalate privilege to view other tenants' data under any circumstance.

### 8.7 Session & Credential Policy

- **BP-60** Passwords must be at least 12 characters and include upper, lower, number, and symbol.
- **BP-61** Active sessions expire after 15 minutes of inactivity.
- **BP-62** Extended sessions expire after 7 days, requiring a full sign-in.
- **BP-63** MFA is **required** for Admins in Production; **optional** elsewhere.

### 8.8 Data Retention & Archival

- **BP-70** Audit logs: 90 days then purged.
- **BP-71** Firmware binaries: archived to cold storage after 365 days.
- **BP-72** Notifications: auto-expire after 30 days.
- **BP-73** Deleted firmware: retained recoverable for 30 days, then permanently removed.

---

## 9. Non-Functional Expectations

Stated as **business outcomes**, not technical targets.

### 9.1 Performance — what users feel

- Pages open and are usable within **3.5 seconds** on a typical 4G connection.
- Data tables of 100 rows render without visible lag.
- An interactive map with 1,000 device markers is fully usable within **2 seconds**.
- Global search suggestions appear within **150 milliseconds** of typing.
- Exporting 10,000 records to CSV completes within **30 seconds**.
- Navigating between pages feels instant (under 100 milliseconds).

### 9.2 Availability & Reliability

- **99.9% uptime** — at most 8.7 hours of unplanned downtime per year.
- Recovery from catastrophic failure completes in **under 1 hour**.
- Worst-case data loss is bounded at **under 5 minutes**.
- When search services are degraded, the platform falls back to structured filtering — it never "goes dark."
- Real-time notifications are delivered within **1 minute** of the triggering event.

### 9.3 Scalability

- Supports **500 concurrent users** without visible slowdown.
- Manages **50,000 device records** with search remaining sub-second.
- Sustains **500 API operations per second** at peak.
- Audit trail remains query-fast at **10 million+ records**.
- Deployments ship **with zero downtime**.

### 9.4 Security & Compliance

- All data — in transit and at rest — is encrypted.
- Firmware binaries cannot be modified after upload.
- Every user action is recorded for audit.
- Access is governed by role; separation-of-duties is automated, not advisory.
- Sessions auto-lock after 15 minutes of inactivity.
- Brute-force login attempts are throttled by the platform.
- Platform aligns with **NIST 800-53** control framework as the primary compliance target.

### 9.5 Accessibility

- Meets **WCAG 2.1 Level AA**.
- Every interactive element is operable via keyboard alone.
- Colour contrast meets minimum 4.5:1 for body text.
- Respects users who prefer reduced motion (animations disabled).
- Works at up to 200% browser zoom without breaking layout.
- All form inputs are labelled for screen readers.

### 9.6 Browser & Device Support

- Chrome, Firefox, Safari, and Edge — the two most recent major versions of each.
- Mobile Chrome and Mobile Safari on iOS.
- Responsive from **320 pixels** (phones) to **2560 pixels** (large displays).
- Field technicians can complete core workflows on a phone.

---

## 10. Assumptions, Dependencies, Risks

### 10.1 Assumptions

- Users operate with stable internet connectivity — offline workflows are not promised in Gen 2.
- Firmware file sizes are bounded at 2 GB.
- Initial customer deployments are below 50,000 devices; scale beyond that triggers an infrastructure review.
- Users are comfortable with cloud-based SaaS — no desktop client is provided.
- **NIST 800-53** is the primary compliance target; ISO 27001 and SOC 2 are deferred.

### 10.2 External Dependencies

- Cloud infrastructure provider (specific platform is an implementation detail — business continuity depends on the provider's SLAs).
- DNS and email delivery services for account lifecycle (password reset, MFA).
- External change-management system (customer-chosen) for firmware approval routing — only in advanced build cycles.
- External artifact repository (customer-chosen) as an optional firmware source — only in advanced build cycles.

### 10.3 Risks & Mitigations

| #   | Risk                              | Business Impact                                     | Mitigation                                                                                                    |
| --- | --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| R1  | Cross-tenant data leakage         | Loss of customer trust; potential regulatory breach | Tenant ID enforced on every query; penetration testing before production; explicit test coverage on isolation |
| R2  | Firmware approval bypass          | Unsafe firmware reaches the field; liability        | Automated separation-of-duties; no override path; full audit trail of every stage                             |
| R3  | Audit tampering                   | Regulatory non-compliance                           | Audit records are immutable at the platform level; no user has delete rights; independent retention timer     |
| R4  | Prolonged outage                  | Operations halt; customer SLA penalties             | 99.9% availability target; documented recovery procedure; continuous backups                                  |
| R5  | Field users cannot work on mobile | Technicians abandon the tool                        | Mandatory responsive design review per release; technician usability testing before Build 2 closes            |
| R6  | Compliance reports incomplete     | Audit failure                                       | Report generator covers CSV and JSON; auditor dry-run scheduled before GA                                     |
| R7  | Adoption stalls                   | Product goodwill loss                               | Early design-partner pilot; feedback loop before GA; UX polish built into every build cycle                   |

---

## 11. Glossary

| Term                           | Definition                                                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Audit Trail**                | The chronological, tamper-proof record of every change made in the platform. Used for compliance, forensics, and dispute resolution.                                             |
| **Blast Radius**               | The set of devices impacted by a specific vulnerability, failure, or firmware issue. Answers "how bad is this?"                                                                  |
| **Certification**              | A regulatory or standards approval tied to a firmware version and device model (e.g., IEC 62109 for solar inverters).                                                            |
| **Command Palette**            | A keyboard-driven search overlay opened from anywhere in the app.                                                                                                                |
| **Compliance Item**            | A record linking a firmware version and device model to a certification type and a review status.                                                                                |
| **CVE**                        | Common Vulnerabilities and Exposures — the industry-standard identifier for a known security flaw.                                                                               |
| **Customer**                   | An organization that uses the platform to manage its own fleet. The platform supports many customers simultaneously (multi-tenant).                                              |
| **CustomerAdmin**              | A role that grants a customer's own staff read-and-manage access to their own organization's data only.                                                                          |
| **Digital Twin**               | A virtual replica of a physical device, used for firmware simulation, drift detection, and historical replay.                                                                    |
| **Executive Summary**          | A one-page, export-ready overview of KPIs, status, and trends, suitable for board or customer presentation.                                                                      |
| **Incident**                   | A recorded event requiring investigation and response — e.g., a detected vulnerability or device compromise.                                                                     |
| **Kanban Board**               | A visual workflow board with columns (Scheduled, In Progress, Completed) where cards are dragged between columns.                                                                |
| **MFA**                        | Multi-Factor Authentication — a second credential (typically a time-based code from a phone app) required in addition to the password.                                           |
| **NIST 800-53**                | The U.S. federal catalog of security and privacy controls. The primary compliance frame for Gen 2.                                                                               |
| **RBAC**                       | Role-Based Access Control — permissions are granted by role, not by individual.                                                                                                  |
| **Response Playbook**          | A pre-defined checklist of steps executed when a specific incident category occurs.                                                                                              |
| **RPO**                        | Recovery Point Objective — the maximum acceptable window of data that may be lost in an outage. Gen 2 target: 5 minutes.                                                         |
| **RTO**                        | Recovery Time Objective — the maximum acceptable time to restore service after an outage. Gen 2 target: 1 hour.                                                                  |
| **SBOM**                       | Software Bill of Materials — a complete inventory of every component and dependency inside a firmware package.                                                                   |
| **Separation of Duties (SoD)** | A governance principle requiring that no single person can complete all steps of a sensitive process (e.g., firmware upload, test, and approval must be three different people). |
| **Service Order**              | A scheduled task for a field technician — install, repair, inspect — with location, date/time, priority, and status.                                                             |
| **SLA**                        | Service Level Agreement — the platform's commitment on uptime, response time, and availability.                                                                                  |
| **Status (Device)**            | Online, Offline, or Maintenance.                                                                                                                                                 |
| **Status (Firmware)**          | Uploaded, Testing, Approved, or Deprecated.                                                                                                                                      |
| **Status (Service Order)**     | Scheduled, In Progress, or Completed.                                                                                                                                            |
| **Tenant Isolation**           | The guarantee that data belonging to one customer is never visible to another customer.                                                                                          |
| **WCAG 2.1 AA**                | Web Content Accessibility Guidelines, Level AA — the accessibility standard targeted by Gen 2.                                                                                   |

---

_End of Business Requirements Document._
_Companion: see `Implementation-Plan.md` for how these requirements map to build cycles, epics, and stories._

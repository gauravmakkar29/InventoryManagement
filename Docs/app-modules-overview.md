# IMS Gen2 — Application Modules Overview

**Platform:** Hardware Lifecycle Management (HLM)
**Purpose:** Enterprise device inventory, firmware deployment, compliance tracking & operational analytics

---

## Navigation Structure

```
MAIN
  Dashboard              — Fleet overview & system health
  Inventory              — Device asset management

OPERATIONS
  Deployment             — Firmware lifecycle & approvals
  Compliance             — Regulatory certification tracking
  SBOM                   — Software bill of materials
  Service Orders         — Maintenance & field service
  Analytics              — Reporting & trend analysis
  Telemetry              — Real-time device monitoring
  Incidents              — Security response & quarantine
  Digital Twin           — Device simulation & drift detection
  Executive Summary      — Stakeholder briefing dashboard

ADMIN
  User Management        — Accounts, roles & permissions
```

---

## Module Details

### 1. Dashboard

Central command center with real-time fleet health at a glance.

| Feature           | Details                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **KPI Cards**     | Total Devices, Active Deployments, Pending Approvals, Fleet Health %                                       |
| **System Status** | Service health indicators (Deployment Pipeline, Compliance Engine, Asset Database, Analytics)              |
| **Quick Actions** | 6 shortcuts — Register Device, New Deployment, Pending Reviews, Service Orders, View Reports, Manage Users |
| **Alerts**        | "Requires Attention" panel — firmware approvals, critical CVEs, offline devices                            |
| **Activity**      | Recent activity feed with timestamps, users, and actions                                                   |

---

### 2. Inventory

Centralized hardware asset tracking with search, filtering, and geographic views.

| Tab              | What it shows                                                               |
| ---------------- | --------------------------------------------------------------------------- |
| **Hardware**     | Sortable device table — name, serial, model, status, location, health score |
| **Firmware**     | Card grid showing firmware version and health per device                    |
| **Geo Location** | Interactive map with device markers, clustering, and geofences              |

**Key actions:** Add Device, Export CSV, Search/Filter (status, location, model, health range), Sort columns

---

### 3. Deployment

Firmware version management with multi-stage approval workflow.

| Tab                    | What it shows                                                                    |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Firmware**           | Version cards with approval workflow: Uploaded → Testing → Approved → Deprecated |
| **Vulnerabilities**    | CVE tracking per firmware — severity, affected component, remediation status     |
| **Regulatory Reports** | Generate compliance reports (NIST 800-53, IEC 62443, SOC 2, ISO 27001)           |
| **Audit Log**          | Immutable record of all actions — timestamp, user, action, resource, IP, status  |

---

### 4. Compliance

Multi-standard certification tracking and vulnerability remediation.

| Tab                 | What it shows                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| **Compliance**      | Certification status per standard — NIST 800-53, IEC 62443, SOC 2, ISO 27001, NERC CIP, UL 1741 |
| **Vulnerabilities** | CVE list with severity, CVSS score, affected devices, patch availability                        |
| **Reports**         | Downloadable regulatory compliance reports                                                      |

**Statuses:** Approved, Pending, In Review, Deprecated, Non-Compliant

---

### 5. SBOM (Software Bill of Materials)

Component inventory and license compliance for firmware packages.

| Tab                    | What it shows                                                        |
| ---------------------- | -------------------------------------------------------------------- |
| **Management**         | Upload & track SBOM documents (CycloneDX, SPDX formats)              |
| **Components**         | Software components with license type, supplier, vulnerability count |
| **CVE Dashboard**      | Vulnerability analysis with severity breakdown chart                 |
| **License Compliance** | License policy tracking — Approved, Restricted, Unknown              |

---

### 6. Service Orders

Maintenance scheduling and field service tracking.

| View         | What it shows                                                           |
| ------------ | ----------------------------------------------------------------------- |
| **Kanban**   | Cards organized by status columns — Scheduled → In Progress → Completed |
| **Calendar** | Timeline view of service orders by scheduled date                       |

**Order attributes:** ID, title, technician, priority (High/Medium/Low), service type (Internal/3rd Party), location

---

### 7. Analytics

Fleet performance reporting with historical trends.

| Feature         | Details                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| **KPIs**        | Total Devices, Active Deployments, Compliance Score, Uptime                     |
| **Time Ranges** | 7d, 30d, 90d, YTD, Custom                                                       |
| **Charts**      | Monthly deployment count, device distribution by region, vulnerability severity |
| **Audit Table** | Activity log with user, action, entity, and timestamp                           |

---

### 8. Telemetry

Real-time device performance monitoring and risk analysis.

| Tab                        | What it shows                                                           |
| -------------------------- | ----------------------------------------------------------------------- |
| **Overview**               | Telemetry ingestion status and key health metrics                       |
| **Device Telemetry**       | Time-series charts — temperature, CPU load, error rates per device      |
| **Heatmap & Blast Radius** | Geographic visualization with failure propagation and impact simulation |

---

### 9. Incidents

Security incident response, device isolation, and quarantine management.

| Tab                  | What it shows                                             |
| -------------------- | --------------------------------------------------------- |
| **Incidents**        | Active incident list — severity, status, affected devices |
| **Isolated Devices** | Currently quarantined/locked devices                      |
| **Quarantine Zones** | Geographic or network isolation regions                   |
| **Playbooks**        | Incident response playbooks and automation                |
| **Metrics**          | Incident KPIs and historical trends                       |

**Workflow:** Open → Investigating → Contained → Resolved → Closed

---

### 10. Digital Twin

Virtual device models for simulation and configuration drift detection.

| Feature                | Details                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Health Score**       | Weighted calculation from firmware age, vulnerability exposure, uptime, telemetry, compliance, incident history |
| **Drift Detection**    | Expected vs actual configuration values with severity levels                                                    |
| **Health Tiers**       | Excellent (90-100%), Good (70-89%), Fair (50-69%), Critical (<50%)                                              |
| **Upgrade Simulation** | Predict impact of firmware updates — compatibility, health change, downtime, rollback risk                      |

---

### 11. Executive Summary

Presentation-ready dashboard for leadership and stakeholder briefings.

| Feature        | Details                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| **KPIs**       | Total Devices, Health Score %, Uptime (30d), Open Incidents                                |
| **Charts**     | Device status distribution, compliance breakdown, weekly deployments, 10-week health trend |
| **Actions**    | Print, download, auto-refresh (60s)                                                        |
| **Time Range** | 7d, 30d, 90d                                                                               |

---

### 12. User Management

User account administration with role-based access control.

| Feature        | Details                                                   |
| -------------- | --------------------------------------------------------- |
| **User Table** | Name, email, role, department, status, last login         |
| **Roles**      | Admin, Manager, Technician, Viewer, CustomerAdmin         |
| **Statuses**   | Active, Invited, Disabled                                 |
| **Actions**    | Invite user, edit role/department, enable/disable account |

---

### 13. Search

Global navigation and entity discovery across the platform.

| Component                | Trigger           | What it does                                                                 |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------- |
| **Command Palette**      | `Ctrl+K`          | Quick navigation to any page — keyboard-driven                               |
| **Global Search**        | Header search bar | Search across devices, firmware, service orders, compliance, vulnerabilities |
| **Advanced Search**      | Inventory page    | Faceted filtering with status, location, model, health range                 |
| **Vulnerability Search** | Compliance page   | CVE-specific search with severity filtering                                  |

---

## Cross-Cutting Features

| Feature                  | Available in                                       |
| ------------------------ | -------------------------------------------------- |
| **Dark Mode**            | All pages (theme toggle in header)                 |
| **Notifications**        | Real-time alerts panel (bell icon)                 |
| **Connectivity Monitor** | Service health status bar                          |
| **Role-Based Access**    | Navigation items and actions filtered by user role |
| **Responsive Layout**    | Desktop-optimized with collapsible sidebar         |

---

## Tech Stack

| Layer              | Technology                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Frontend**       | React 18, TypeScript, Vite 6, TailwindCSS 4, shadcn/ui                            |
| **Maps**           | React Simple Maps (SVG/D3, free, no API key)                                      |
| **Charts**         | Recharts (composable chart library)                                               |
| **Auth**           | Mock Cognito (localStorage sessions)                                              |
| **API**            | Mock AppSync/GraphQL (returns demo data)                                          |
| **Infrastructure** | Terraform on AWS (DynamoDB, Cognito, AppSync, S3, CloudFront, Lambda, OpenSearch) |
| **E2E Testing**    | Java 17, Maven, TestNG, Playwright                                                |
| **CI/CD**          | GitHub Actions                                                                    |

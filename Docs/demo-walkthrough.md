# IMS Gen 2 — Demo Walkthrough

> A guided tour through the platform, told as a story.
> Use this when presenting the app to stakeholders, PDMs, or new team members.

---

## The Story

You're the **IT Operations Manager** at a solar energy company managing 10,000+ field inverters, controllers, and monitoring stations across multiple sites. Your devices run firmware that needs regular updates, compliance certifications expire, vulnerabilities are discovered, and field technicians need service orders to keep everything running.

This is how your day unfolds in IMS Gen 2.

---

## Act 1: Sign In & Dashboard (Admin View)

### Login

1. Open **http://localhost:5173**
2. Sign in as **admin@company.com** / **Admin@12345678**

> You're the Admin — you see everything, control everything.

### Dashboard

The first thing you see is the **executive dashboard**:

- **KPI Cards** — Total devices, online count, active deployments, pending approvals, fleet health score. These load with skeleton animations, then populate with real-time data.
- **System Status** — Green/red dots showing which subsystems are healthy (API, Auth, Database, Firmware CDN).
- **Quick Actions** — Tiles with badge counts: "5 Pending Approvals", "3 Open Service Orders". One click takes you there.
- **Recent Activity** — Timeline of recent system events with color-coded module badges.

**What to point out:** The dashboard is data-first, not decorative. No gradients, no bouncy animations. Enterprise authority — think Sungrow, not Dribbble.

---

## Act 2: Inventory — The Heart of the System

Click **Inventory** in the sidebar.

### Device Table

- **25 devices** displayed in a compact data table
- Columns: Device Name, Serial Number, Model, Status (color-coded badges), Location, Health Score (progress bar)
- **Search bar** — type a serial number or device name, results filter instantly
- **Status filter** — dropdown to filter by Online, Offline, Maintenance, Decommissioned
- **Location filter** — filter by site/building

### Device Detail Tabs

Click any device row to see:

1. **Overview** — Full device details with firmware version, last seen timestamp
2. **Firmware Status** — Current firmware, update history, pending updates
3. **Geo Location** — Map view showing device position (powered by MapLibre GL)

### Create Device (Admin/Manager only)

- Click **"Add Device"** button (top-right)
- Fill the modal: name, serial, model, firmware version, status, location, coordinates
- Submit → device appears instantly (optimistic update with rollback on error)

> **RBAC Demo Point:** Log out and sign in as `tech@company.com`. The "Add Device" button is still there (Technicians can create). But sign in as `viewer@company.com` — the button is gone. Viewers are read-only.

---

## Act 3: Deployment — Firmware Lifecycle

Click **Deployment** in the sidebar.

### Firmware Cards

- Each firmware version shown as a card: version number, status badge, upload date, checksum
- Statuses: Uploaded → Testing → Approved → Deprecated

### Multi-Stage Approval

This is where **separation of duties** kicks in:

1. An engineer **uploads** a firmware package
2. A QA lead marks it as **Testing**
3. A different manager (not the uploader) clicks **Approve**
4. The approval chain is recorded in the **Audit Log**

> Each approval stage requires a different user — no single person can push firmware from upload to production. This is a NIST 800-53 control.

### Audit Trail Tab

- Every action logged: who did what, when, from which IP
- Searchable, exportable to CSV
- Tamper-proof — logs are write-once

---

## Act 4: Compliance & Vulnerabilities

Click **Compliance** in the sidebar.

### Compliance Items

- Certifications, regulatory requirements, internal policies
- Status pipeline: Pending → In Review → Approved / Non-Compliant
- Submit for review → another user approves (separation of duties again)

### Vulnerability Panel

- CVE-style vulnerability tracking
- Severity badges: Critical (red), High (orange), Medium (yellow), Low (blue)
- Link vulnerabilities to affected devices and firmware versions

> **The connection:** A firmware version flagged in Deployment may have a vulnerability here. The compliance team tracks whether devices running that firmware meet regulatory requirements. Everything is linked.

---

## Act 5: Service Orders — Field Operations

Click **Service Orders** in the sidebar.

### Kanban Board

- Drag-and-drop columns: Scheduled → In Progress → Completed → Cancelled
- Each card shows: title, priority badge, assignee, creation date
- Drag a card from "Scheduled" to "In Progress" → status updates instantly

### Calendar View

- Toggle to calendar view — see service orders plotted on a monthly/weekly calendar
- Visual planning for field technician schedules

### Create Service Order

- Click "Create Order" → modal with title, priority, assignee, description
- Orders can be linked to devices from Inventory

> **The connection:** A device showing "Maintenance" status in Inventory likely has an open Service Order here. The technician sees it on their Kanban board.

---

## Act 6: RBAC in Action

This is the most powerful demo segment. Show the **same app, four different experiences:**

### Admin (admin@company.com)

- Full sidebar: all 12 pages + User Management
- All action buttons visible: Create, Edit, Delete, Approve
- User Management page: invite users, assign roles, deactivate accounts

### Manager (manager@company.com)

- Sidebar: everything except User Management
- Actions: Create, Edit, Approve (no Delete)
- Can approve firmware, but cannot manage users

### Technician (tech@company.com)

- Sidebar: only Dashboard, Inventory, Service Orders
- Actions: Create, Edit (no Approve, no Delete)
- Can create devices and service orders, but cannot approve firmware or manage compliance

### Viewer (viewer@company.com)

- Sidebar: 10 pages (read-only access to most modules)
- Actions: **none** — no Create, Edit, Delete, or Approve buttons anywhere
- Pure read-only audit/oversight role

### CustomerAdmin (customer@tenant.com)

- Sidebar: Dashboard, Inventory, Service Orders
- Actions: Create, Edit
- **Key difference:** Data is filtered to their tenant only (`customerId: "cust-001"`)

---

## Act 7: Analytics & Monitoring

### Analytics Page

- KPI cards with trend indicators
- Charts: Device status distribution (pie), Deployment trend (line), Vulnerability severity (bar)
- Time range filter: 7d, 30d, 90d, 1y
- Export to CSV

### Telemetry (if enabled)

- Real-time device metrics: temperature, CPU, memory, uptime
- Heatmap overlaid on geo map — see hot zones
- Blast radius calculation: "If this device fails, what's affected?"

### Digital Twin

- Virtual device replicas showing predicted health trajectory
- Configuration drift detection — flag when a device's actual state diverges from desired state
- "What-if" firmware upgrade simulation

---

## Act 8: The Notification System

Click the **bell icon** in the header.

- Slide-out panel from the right
- 7 mock notifications with severity-colored icons
- Unread count badge (red, max "99+")
- Mark as read, dismiss individual notifications

> Notifications connect to events across all modules: firmware approved, vulnerability discovered, service order overdue, compliance expiring.

---

## Act 9: Accessibility & Enterprise Quality

### Keyboard Navigation

- Press **Tab** to navigate between elements
- **Skip to Content** link appears on first Tab press
- All modals have focus traps
- **Ctrl+K** opens the Command Palette — search and navigate anywhere

### Dark Mode

- Click the theme toggle in the header
- All components, charts, and maps respect the theme
- No contrast issues — WCAG 2.1 AA compliant in both modes

### Responsive

- Resize the browser to tablet width
- Sidebar collapses to icons
- Tables become scrollable
- Cards reflow to single column

---

## Act 10: Under the Hood (For Technical Audience)

### Cloud-Agnostic Architecture

- Show `src/lib/providers/` — the abstraction layer
- Everything runs on **mock adapters** right now, no cloud
- Swap `VITE_PLATFORM=aws-amplify` and implement 3 adapter files → connected to real AWS

### Session Management

- Open two browser tabs, sign in on both
- Sign out on one → **the other signs out automatically** (BroadcastChannel sync)
- Session expires → warning modal with "Keep Me Signed In" button

### API Resilience

- The API client has circuit breaker, exponential backoff, rate limit awareness
- If the backend goes down, the circuit opens after 5 failures and auto-recovers

### Security

- CSP headers, CSRF protection, XSS sanitization — all built in
- No secrets in code, no hardcoded API keys

---

## Closing Notes

### The Modules Are Connected

```
Inventory ──→ Devices have firmware ──→ Deployment tracks versions
    │                                        │
    ├── Devices have locations ──→ Geo Map    ├── Firmware has vulnerabilities ──→ Compliance
    │                                        │
    └── Devices need maintenance ──→ Service Orders
                                             │
                                    Analytics ←── aggregates everything
                                             │
                                    Telemetry ←── real-time health data
                                             │
                                    Digital Twin ←── predictive modeling
```

### Key Differentiators to Highlight

1. **Enterprise-grade, not a toy** — real RBAC, audit trails, separation of duties
2. **Cloud-agnostic** — runs anywhere, no vendor lock-in
3. **Template-ready** — fork it, implement 3 adapter files, you have a production app
4. **Full QA pipeline** — test plans → E2E scripts → auto-triage, all via Claude commands
5. **WCAG 2.1 AA accessible** — keyboard navigation, focus traps, contrast ratios
6. **130+ automated tests** — unit + E2E + accessibility

---

_Duration: 15–25 minutes depending on depth. Skip Acts 7–9 for a 10-minute executive overview._

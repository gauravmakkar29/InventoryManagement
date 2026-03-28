# Epic 2: Dashboard & Executive Overview — Technical Specification

**Epic:** Epic 2 — Dashboard & Executive Overview
**Brief Reference:** FR-8, Section 10.2 Dashboard, Section 10.8 Notification System

---

## 1. Overview

This epic implements the main Dashboard page, which serves as the landing page for all authenticated users. It includes 4 KPI summary cards, 6 quick action links with badge counts, a recent alerts panel, system status indicators, and a notification bell with slide-out panel.

---

## 2. Data Dependencies

The Dashboard does not have its own entity type. It aggregates data from multiple entity queries executed in parallel on mount.

### 2.1 Queries Used

| KPI / Section | Query | Source |
|---------------|-------|--------|
| Total Devices | `listDevices(limit: 0)` or `getAggregations("devicesByStatus")` | GSI1 / OpenSearch |
| Active Deployments | `listFirmware(status: "Pending")` | GSI1 |
| Pending Approvals | `listFirmware(status: "Pending")` filtered by `approvalStage` | GSI1 |
| Health Score | `getAggregations("healthScoreDistribution")` or client-side avg | OpenSearch / computed |
| Quick Actions | Counts from above queries | Derived |
| Recent Alerts | `listAuditLogs(last24h)` | GSI2 |
| System Status | Health check endpoints or static config | Infrastructure |
| Notifications | `listNotifications(userId, unreadOnly: true)` | GSI4 |

### 2.2 Parallel Fetch Pattern

```typescript
const [devices, firmware, auditLogs, notifications] = await Promise.all([
  listDevices(),
  listFirmware(),
  listAuditLogs(yesterday, now),
  listNotifications(userId, true)
]);
```

---

## 3. Notification Entity

```typescript
{
  PK: "NOTIF#<uuid>",
  SK: "NOTIF#<uuid>",
  entityType: "Notification",
  recipientId: string,
  type: "firmware_approved" | "firmware_stage_advanced" | "service_order_assigned" |
        "service_order_completed" | "vulnerability_critical" | "compliance_status_changed" |
        "device_offline" | "system_alert",
  title: string,
  message: string,
  severity: "info" | "warning" | "critical",
  sourceEntityType: string,
  sourceEntityId: string,
  read: boolean,
  readAt: string,
  createdAt: string,
  ttl: number,              // 30-day auto-expiry
  GSI1PK: "NOTIFICATION",
  GSI1SK: "<read|unread>#<timestamp>",
  GSI4PK: "USER#<recipientId>",
  GSI4SK: "NOTIF#<uuid>"
}
```

### 3.1 Notification API

| Operation | Type | Description |
|-----------|------|-------------|
| `listNotifications(userId, unreadOnly?, limit?)` | Query (GSI4) | Get notifications for a user |
| `markNotificationRead(notificationId)` | Mutation | Set read=true, readAt=now |
| `markAllNotificationsRead(userId)` | Mutation | Bulk update all unread for user |
| `getUnreadCount(userId)` | Query (GSI4 + filter) | Count for badge display |
| `onNotificationCreated(recipientId)` | Subscription | Real-time push via WebSocket |

---

## 4. Component Hierarchy

```
src/app/components/
├── dashboard.tsx                 # Main dashboard page
│   ├── KPICard (x4)            # Compact metric cards
│   ├── QuickActions             # 6 links with badge counts
│   ├── RecentAlerts             # Audit log entries (last 24h)
│   └── SystemStatus             # 4 service health indicators
├── layout/
│   └── header.tsx
│       └── NotificationBell     # Bell icon with unread badge
│           └── NotificationPanel # Slide-out sheet (360px)
│               └── NotificationItem (repeated)
```

### 4.1 KPI Card Component

```typescript
interface KPICardProps {
  title: string;        // "Total Devices"
  value: string | number; // "1,247"
  icon: LucideIcon;
  trend?: { direction: "up" | "down"; percent: number };
}
```

### 4.2 Quick Actions

6 links with pending item counts:
1. View Inventory (device count)
2. Manage Deployments (active count)
3. Pending Approvals (pending count)
4. Service Orders (open count)
5. Compliance Status (pending review count)
6. View Analytics (link only)

### 4.3 System Status Indicators

4 service health statuses displayed as colored dots:
- Deployment Service (green/red)
- Compliance Engine (green/red)
- Asset Database (green/red)
- Analytics Pipeline (green/red)

Status is derived from successful API responses during the parallel fetch. If a query fails, that service shows as degraded.

---

## 5. Notification Panel UI

- **Trigger:** Bell icon in header with red badge showing unread count (max "99+")
- **Panel:** Sheet component, slides from right, 360px wide
- **Items:** Severity icon (red=critical, amber=warning, blue=info) + title + message + relative timestamp
- **Click item:** Navigate to source entity via deep link (`sourceEntityType` + `sourceEntityId`)
- **Mark as read:** Individual click or "Mark all as read" button
- **Real-time:** AppSync subscription for push updates; falls back to 60s polling if WebSocket disconnects

---

## 6. Data Refresh

- Dashboard data fetches on mount via `useEffect` with parallel `Promise.all`
- Manual refresh button in top-right triggers re-fetch of all data
- Notification count updates in real-time via WebSocket subscription
- No automatic polling for dashboard data (manual refresh only)

---

## 7. CustomerAdmin Scoping

When a CustomerAdmin user views the dashboard:
- KPIs show only their organization's device count, deployments, and health score
- Recent alerts filtered to their customerId
- Notifications filtered by recipientId (automatic via GSI4 query)

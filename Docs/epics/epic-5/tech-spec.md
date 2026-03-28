# Epic 5: Account & Service Orders — Technical Specification

**Epic:** Epic 5 — Account & Service Orders
**Brief Reference:** FR-3, Section 10.2 Account/Service (Kanban drag-drop, calendar view, CRUD)

---

## 1. Overview

This epic implements the Account & Service page with two view modes: a Kanban board (drag-and-drop columns) and a Calendar view (monthly grid). It covers service order CRUD, status transitions via drag-and-drop, and technician assignment.

---

## 2. Data Model

### 2.1 ServiceOrder Entity

```typescript
{
  PK: "SO#<uuid>",
  SK: "SO#<uuid>",
  entityType: "ServiceOrder",
  title: string,
  technicianId: string,
  serviceType: "Internal" | "3rd Party",
  location: string,
  scheduledDate: string,        // ISO8601 date
  scheduledTime: string,        // e.g., "09:00"
  priority: "High" | "Medium" | "Low",
  status: "Scheduled" | "In Progress" | "Completed",
  customerId: string,
  GSI1PK: "SERVICE_ORDER",
  GSI1SK: "<status>#<timestamp>",
  GSI2PK: "SERVICE_ORDER",
  GSI2SK: "<scheduledDate>",
  GSI3PK: "<technicianId>",
  GSI3SK: "SO#<uuid>",
  GSI4PK: "CUST#<customerId>",
  GSI4SK: "SO#<uuid>"
}
```

### 2.2 GSI Access Patterns

| GSI | Query | Purpose |
|-----|-------|---------|
| GSI1 | `listServiceOrdersByStatus(status)` | Orders filtered by status |
| GSI2 | `listServiceOrdersByDate(startDate, endDate)` | Orders in a date range (calendar view) |
| GSI3 | `getServiceOrdersByTechnician(technicianId)` | Orders assigned to a technician |
| GSI4 | `getServiceOrdersByCustomer(customerId)` | Orders for a customer (CustomerAdmin) |

---

## 3. API Contracts

### 3.1 Queries

| Query | Arguments | Returns | Auth |
|-------|-----------|---------|------|
| `listServiceOrdersByStatus(status)` | Status string | `ServiceOrder[]` | Admin, Manager, Technician (own) |
| `listServiceOrdersByDate(startDate, endDate)` | Date range | `ServiceOrder[]` | Admin, Manager, Technician (own) |
| `getServiceOrdersByTechnician(technicianId)` | Technician user ID | `ServiceOrder[]` | Admin, Manager, Technician (self) |
| `getServiceOrder(id)` | Order ID | `ServiceOrder` | Admin, Manager, Technician (own) |

### 3.2 Mutations

| Mutation | Arguments | Returns | Auth |
|----------|-----------|---------|------|
| `createServiceOrder(input)` | Order fields | `ServiceOrder` | Admin, Manager |
| `updateEntityStatus("ServiceOrder", id, newStatus)` | ID, new status | `ServiceOrder` | Admin, Manager, Technician (own orders) |

---

## 4. Component Hierarchy

```
src/app/components/
├── account-service.tsx              # Main page
│   ├── ViewToggle (Kanban / Calendar segmented control)
│   ├── FilterBar
│   │   ├── StatusFilter
│   │   ├── PriorityFilter
│   │   ├── TechnicianFilter
│   │   ├── DateRangeFilter
│   │   └── ExportCSVButton
│   ├── CreateServiceOrderButton
│   │   └── CreateServiceOrderModal (Dialog)
│   │       └── Form (title, technician, type, location, date, time, priority)
│   ├── KanbanView
│   │   ├── KanbanColumn (x3: Scheduled, In Progress, Completed)
│   │   │   └── ServiceOrderCard (draggable)
│   │   │       ├── Title
│   │   │       ├── TechnicianName
│   │   │       ├── ScheduledDate
│   │   │       ├── PriorityBadge (color-coded)
│   │   │       └── ServiceTypeTag
│   └── CalendarView
│       ├── MonthNavigation (prev/next/today)
│       ├── MonthGrid (7x5-6 cells)
│       │   └── CalendarDay
│       │       └── OrderDot/Block (color-coded by priority)
│       └── DayPopover (click day -> list of orders)
```

---

## 5. Kanban Board

### 5.1 Columns

| Column | Status | Behavior |
|--------|--------|----------|
| Scheduled | `"Scheduled"` | New orders land here |
| In Progress | `"In Progress"` | Work actively being performed |
| Completed | `"Completed"` | Finished orders |

### 5.2 Drag and Drop

- Library: `react-dnd` with HTML5 Backend
- Dragging a card between columns triggers `updateEntityStatus` mutation
- Optimistic update: card moves immediately, rolls back on API failure
- Technicians can only drag their own orders
- Empty column shows: "No orders in this stage"

### 5.3 Service Order Card

| Field | Display |
|-------|---------|
| Title | Bold, primary text |
| Technician | User name (resolved from technicianId) |
| Date | Formatted scheduled date |
| Priority | Color badge: Red (High), Amber (Medium), Green (Low) |
| Service Type | Tag: "Internal" or "3rd Party" |

---

## 6. Calendar View

### 6.1 Layout

- Monthly grid with day-of-week headers (Mon-Sun)
- Each day cell shows service order indicators as colored dots
- Priority color coding: High=red, Medium=amber, Low=green

### 6.2 Interactions

- Click date cell -> popover shows list of orders for that day
- Previous/Next month arrows for navigation
- "Today" button returns to current month
- Current day cell has accent highlight

### 6.3 Data Fetching

Calendar view uses `listServiceOrdersByDate(monthStart, monthEnd)` (GSI2) to fetch orders for the visible month. When navigating months, a new query is made.

---

## 7. Create Service Order Modal

### 7.1 Form Fields

| Field | Type | Required | Options |
|-------|------|----------|---------|
| Title | Text input | Yes | Free text |
| Technician | Dropdown | Yes | Populated from user list (Technician role) |
| Service Type | Radio/Dropdown | Yes | Internal, 3rd Party |
| Location | Text input | Yes | Free text |
| Scheduled Date | Date picker | Yes | Calendar picker |
| Scheduled Time | Time picker | Yes | Time input |
| Priority | Dropdown | Yes | High, Medium, Low |
| Customer | Dropdown | Yes | Populated from customer list |

### 7.2 Validation

- All fields required
- Scheduled date must be today or in the future
- react-hook-form handles validation and error display

---

## 8. Technician Scoping

When a Technician user views the Account/Service page:
- Kanban board shows only their assigned orders
- Calendar shows only their scheduled orders
- They can drag only their own cards (to update status)
- Create Service Order button is hidden

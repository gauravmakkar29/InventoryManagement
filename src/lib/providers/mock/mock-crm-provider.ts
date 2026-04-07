import type {
  ICRMProvider,
  CRMCustomer,
  CRMTicket,
  CRMTicketInput,
  CRMComment,
  CRMSyncResult,
} from "../types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_CUSTOMERS: CRMCustomer[] = [
  {
    id: "cust-001",
    name: "SolarTech Industries",
    contactEmail: "ops@solartech-ind.com",
    contactPhone: "+1-408-555-0120",
    contractType: "Enterprise",
    region: "North America",
    sites: ["San Jose HQ", "Austin Depot", "Denver Warehouse"],
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "cust-002",
    name: "GridPower Solutions",
    contactEmail: "support@gridpower.co.uk",
    contactPhone: "+44-20-7946-0958",
    contractType: "Premium",
    region: "EMEA",
    sites: ["London Office", "Manchester Plant"],
    createdAt: "2024-02-20T10:30:00Z",
  },
  {
    id: "cust-003",
    name: "Pacific Energy Corp",
    contactEmail: "admin@pacificenergy.jp",
    contactPhone: "+81-3-1234-5678",
    contractType: "Standard",
    region: "APAC",
    sites: ["Tokyo HQ", "Osaka Factory", "Nagoya DC"],
    createdAt: "2024-03-10T14:00:00Z",
  },
  {
    id: "cust-004",
    name: "Meridian Power Systems",
    contactEmail: "fleet@meridianpower.com.au",
    contactPhone: "+61-2-9876-5432",
    contractType: "Enterprise",
    region: "APAC",
    sites: ["Sydney Operations", "Melbourne Lab"],
    createdAt: "2024-04-05T09:15:00Z",
  },
  {
    id: "cust-005",
    name: "NovaStar Renewables",
    contactEmail: "service@novastar-renew.de",
    contactPhone: "+49-30-1234-5678",
    contractType: "Premium",
    region: "EMEA",
    sites: ["Berlin HQ", "Munich R&D", "Hamburg Warehouse", "Frankfurt DC"],
    createdAt: "2024-05-18T11:45:00Z",
  },
];

const MOCK_TICKETS: CRMTicket[] = [
  {
    id: "tkt-001",
    customerId: "cust-001",
    subject: "Inverter SN-4821 offline",
    description: "Unit stopped reporting telemetry at 03:14 UTC. On-site technician dispatched.",
    status: "open",
    priority: "critical",
    assignedTo: "jsmith",
    createdAt: "2025-11-01T03:14:00Z",
    updatedAt: "2025-11-01T03:14:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-002",
    customerId: "cust-001",
    subject: "Firmware rollback request — v2.4.1",
    description: "Customer reports increased fault rate after v2.4.1 deployment on 12 units.",
    status: "in-progress",
    priority: "high",
    assignedTo: "agarcia",
    createdAt: "2025-10-28T09:00:00Z",
    updatedAt: "2025-10-29T14:22:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-003",
    customerId: "cust-002",
    subject: "Compliance certificate renewal",
    description: "Annual IEC 62443 renewal due within 30 days for Manchester Plant.",
    status: "open",
    priority: "medium",
    assignedTo: "bwilson",
    createdAt: "2025-10-25T08:00:00Z",
    updatedAt: "2025-10-25T08:00:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-004",
    customerId: "cust-002",
    subject: "Request for API access documentation",
    description: "Customer integration team needs updated REST API docs for telemetry endpoints.",
    status: "resolved",
    priority: "low",
    assignedTo: "clee",
    createdAt: "2025-10-20T12:00:00Z",
    updatedAt: "2025-10-22T16:30:00Z",
    resolvedAt: "2025-10-22T16:30:00Z",
  },
  {
    id: "tkt-005",
    customerId: "cust-003",
    subject: "Battery module BMS fault — Site Osaka",
    description: "BMS controller reporting cell imbalance on rack 3. Potential thermal risk.",
    status: "open",
    priority: "critical",
    assignedTo: "tanaka",
    createdAt: "2025-11-02T01:45:00Z",
    updatedAt: "2025-11-02T01:45:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-006",
    customerId: "cust-003",
    subject: "Scheduled maintenance window request",
    description: "Customer requests maintenance window for Nagoya DC — 2025-11-15 02:00-06:00 JST.",
    status: "in-progress",
    priority: "medium",
    assignedTo: "tanaka",
    createdAt: "2025-10-30T07:00:00Z",
    updatedAt: "2025-10-31T09:15:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-007",
    customerId: "cust-004",
    subject: "New site onboarding — Perth depot",
    description: "Meridian expanding to Perth. Need 24 gateway devices provisioned.",
    status: "open",
    priority: "high",
    assignedTo: "mchen",
    createdAt: "2025-10-27T04:30:00Z",
    updatedAt: "2025-10-27T04:30:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-008",
    customerId: "cust-004",
    subject: "False positive vulnerability alert",
    description: "CVE-2025-31337 flagged on gateway FW v3.1.0 but patch already applied.",
    status: "closed",
    priority: "low",
    assignedTo: "mchen",
    createdAt: "2025-10-15T10:00:00Z",
    updatedAt: "2025-10-16T11:00:00Z",
    resolvedAt: "2025-10-16T11:00:00Z",
  },
  {
    id: "tkt-009",
    customerId: "cust-005",
    subject: "Telemetry data gap — Berlin HQ",
    description: "24-hour gap in telemetry data detected. Investigating network switch failure.",
    status: "in-progress",
    priority: "high",
    assignedTo: "kmueller",
    createdAt: "2025-10-29T15:00:00Z",
    updatedAt: "2025-10-30T08:00:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-010",
    customerId: "cust-005",
    subject: "Bulk firmware deployment — Hamburg fleet",
    description:
      "Deploy FW v3.2.0 to 48 devices at Hamburg Warehouse. Requires change-board approval.",
    status: "open",
    priority: "medium",
    assignedTo: "kmueller",
    createdAt: "2025-11-01T06:00:00Z",
    updatedAt: "2025-11-01T06:00:00Z",
    resolvedAt: null,
  },
  {
    id: "tkt-011",
    customerId: "cust-001",
    subject: "Annual service contract renewal",
    description: "Enterprise contract up for renewal 2026-01-15. Legal review pending.",
    status: "resolved",
    priority: "medium",
    assignedTo: "agarcia",
    createdAt: "2025-10-10T09:00:00Z",
    updatedAt: "2025-10-20T17:00:00Z",
    resolvedAt: "2025-10-20T17:00:00Z",
  },
  {
    id: "tkt-012",
    customerId: "cust-003",
    subject: "Warranty claim — defective power module",
    description: "Power module PM-7742 failed within warranty period. RMA initiated.",
    status: "closed",
    priority: "high",
    assignedTo: "tanaka",
    createdAt: "2025-09-15T02:00:00Z",
    updatedAt: "2025-10-01T10:00:00Z",
    resolvedAt: "2025-10-01T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let ticketCounter = MOCK_TICKETS.length;
let commentCounter = 0;

function generateTicketId(): string {
  ticketCounter += 1;
  return `tkt-${String(ticketCounter).padStart(3, "0")}`;
}

function generateCommentId(): string {
  commentCounter += 1;
  return `cmt-${String(commentCounter).padStart(4, "0")}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a mock CRM / ticketing provider for local development and testing.
 *
 * Returns an {@link ICRMProvider} backed by in-memory arrays.
 * Customers and tickets are pre-seeded with realistic data spanning
 * multiple regions, contract types, statuses, and priorities.
 *
 * @example
 * ```ts
 * import { createMockCRMProvider } from "@/lib/providers/mock/mock-crm-provider";
 *
 * const crm = createMockCRMProvider();
 * const customers = await crm.listCustomers({ region: "APAC" });
 * ```
 */
export function createMockCRMProvider(): ICRMProvider {
  // Deep-clone seed data so each provider instance is isolated
  const customers: CRMCustomer[] = structuredClone(MOCK_CUSTOMERS);
  const tickets: CRMTicket[] = structuredClone(MOCK_TICKETS);

  return {
    // ----- Customers -----

    async getCustomer(customerId: string): Promise<CRMCustomer | null> {
      return customers.find((c) => c.id === customerId) ?? null;
    },

    async listCustomers(filters?: {
      region?: string;
      contractType?: string;
    }): Promise<CRMCustomer[]> {
      let result = [...customers];
      if (filters?.region) {
        result = result.filter((c) => c.region === filters.region);
      }
      if (filters?.contractType) {
        result = result.filter((c) => c.contractType === filters.contractType);
      }
      return result;
    },

    async searchCustomers(query: string): Promise<CRMCustomer[]> {
      const q = query.toLowerCase();
      return customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.contactEmail.toLowerCase().includes(q),
      );
    },

    // ----- Tickets -----

    async createTicket(input: CRMTicketInput): Promise<CRMTicket> {
      const now = nowISO();
      const ticket: CRMTicket = {
        id: generateTicketId(),
        customerId: input.customerId,
        subject: input.subject,
        description: input.description,
        status: "open",
        priority: input.priority,
        assignedTo: input.assignedTo ?? null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
      };
      tickets.push(ticket);
      return ticket;
    },

    async updateTicket(ticketId: string, updates: Partial<CRMTicketInput>): Promise<CRMTicket> {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
      }
      Object.assign(ticket, updates, { updatedAt: nowISO() });
      return { ...ticket };
    },

    async getTicket(ticketId: string): Promise<CRMTicket | null> {
      return tickets.find((t) => t.id === ticketId) ?? null;
    },

    async listTickets(filters?: {
      status?: CRMTicket["status"];
      customerId?: string;
      priority?: CRMTicket["priority"];
    }): Promise<CRMTicket[]> {
      let result = [...tickets];
      if (filters?.status) {
        result = result.filter((t) => t.status === filters.status);
      }
      if (filters?.customerId) {
        result = result.filter((t) => t.customerId === filters.customerId);
      }
      if (filters?.priority) {
        result = result.filter((t) => t.priority === filters.priority);
      }
      return result;
    },

    // ----- Comments & Attachments -----

    async addTicketComment(
      ticketId: string,
      comment: Omit<CRMComment, "id" | "ticketId" | "createdAt">,
    ): Promise<CRMComment> {
      return {
        id: generateCommentId(),
        ticketId,
        author: comment.author,
        body: comment.body,
        createdAt: nowISO(),
      };
    },

    async attachFile(
      _ticketId: string,
      _file: File | Blob,
      filename: string,
    ): Promise<{ url: string }> {
      return {
        url: `https://mock-s3.example.com/attachments/${filename}`,
      };
    },

    // ----- Sync -----

    async syncCustomerData(): Promise<CRMSyncResult> {
      return {
        created: 3,
        updated: 12,
        skipped: 85,
        errors: 0,
        syncedAt: nowISO(),
      };
    },
  };
}

// Platform Config
// =============================================================================

// =============================================================================
// CRM / Ticketing Provider
// =============================================================================

export interface CRMCustomer {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  contractType: string;
  region: string;
  sites: string[];
  createdAt: string;
}

export interface CRMTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "critical" | "high" | "medium" | "low";
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CRMTicketInput {
  customerId: string;
  subject: string;
  description: string;
  priority: CRMTicket["priority"];
  assignedTo?: string;
}

export interface CRMComment {
  id: string;
  ticketId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface CRMSyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  syncedAt: string;
}

export interface CRMProviderConfig {
  readonly lambdaEndpoint: string;
  readonly instanceId?: string;
  readonly timeout?: number;
}

/**
 * CRM / Ticketing provider interface — abstracts customer and ticket management.
 *
 * Adapters handle vendor-specific logic (ServiceNow, Jira, Salesforce, Zendesk).
 * The app consumes this interface without knowing which CRM is behind it.
 */
export interface ICRMProvider {
  /**
   * Fetch a single customer by ID.
   *
   * @example
   * ```ts
   * const customer = await crm.getCustomer("cust-001");
   * ```
   */
  getCustomer(customerId: string): Promise<CRMCustomer | null>;

  /**
   * List customers with optional region / contract-type filters.
   *
   * @example
   * ```ts
   * const apacCustomers = await crm.listCustomers({ region: "APAC" });
   * ```
   */
  listCustomers(filters?: { region?: string; contractType?: string }): Promise<CRMCustomer[]>;

  /**
   * Free-text search across customer name and email.
   *
   * @example
   * ```ts
   * const results = await crm.searchCustomers("solar");
   * ```
   */
  searchCustomers(query: string): Promise<CRMCustomer[]>;

  /**
   * Create a new support ticket.
   *
   * @example
   * ```ts
   * const ticket = await crm.createTicket({
   *   customerId: "cust-001",
   *   subject: "Inverter offline",
   *   description: "Unit SN-4821 stopped reporting telemetry.",
   *   priority: "high",
   * });
   * ```
   */
  createTicket(input: CRMTicketInput): Promise<CRMTicket>;

  /**
   * Partially update an existing ticket (status, priority, assignee, etc.).
   *
   * @example
   * ```ts
   * const updated = await crm.updateTicket("tkt-005", { status: "resolved" });
   * ```
   */
  updateTicket(ticketId: string, updates: Partial<CRMTicketInput>): Promise<CRMTicket>;

  /**
   * Fetch a single ticket by ID.
   *
   * @example
   * ```ts
   * const ticket = await crm.getTicket("tkt-005");
   * ```
   */
  getTicket(ticketId: string): Promise<CRMTicket | null>;

  /**
   * List tickets with optional status / customer / priority filters.
   *
   * @example
   * ```ts
   * const openCritical = await crm.listTickets({ status: "open", priority: "critical" });
   * ```
   */
  listTickets(filters?: {
    status?: CRMTicket["status"];
    customerId?: string;
    priority?: CRMTicket["priority"];
  }): Promise<CRMTicket[]>;

  /**
   * Append a comment to a ticket.
   *
   * @example
   * ```ts
   * const comment = await crm.addTicketComment("tkt-005", {
   *   author: "jsmith",
   *   body: "Replaced faulty relay board.",
   * });
   * ```
   */
  addTicketComment(
    ticketId: string,
    comment: Omit<CRMComment, "id" | "ticketId" | "createdAt">,
  ): Promise<CRMComment>;

  /**
   * Attach a file (photo, log dump, etc.) to a ticket.
   *
   * @example
   * ```ts
   * const { url } = await crm.attachFile("tkt-005", blob, "error-log.txt");
   * ```
   */
  attachFile(ticketId: string, file: File | Blob, filename: string): Promise<{ url: string }>;

  /**
   * Trigger a full customer-data sync from the upstream CRM.
   *
   * @example
   * ```ts
   * const result = await crm.syncCustomerData();
   * console.log(`Created ${result.created}, updated ${result.updated}`);
   * ```
   */
  syncCustomerData(): Promise<CRMSyncResult>;
}

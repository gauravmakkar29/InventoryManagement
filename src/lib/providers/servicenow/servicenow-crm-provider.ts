/**
 * ServiceNow CRM adapter — PoC default for Sungrow.
 *
 * Implements ICRMProvider for ServiceNow ITSM. Each method delegates to
 * the Lambda proxy at `config.lambdaEndpoint/crm/*`. The proxy handles
 * ServiceNow REST API authentication (OAuth/basic), table queries, and
 * translates between IMS domain types and ServiceNow record formats.
 *
 * @see Story 20.4 (#386)
 */
import type {
  ICRMProvider,
  CRMCustomer,
  CRMTicket,
  CRMTicketInput,
  CRMComment,
  CRMSyncResult,
  CRMProviderConfig,
} from "../types";

// =============================================================================
// Error classification
// =============================================================================

type ErrorKind = "not-found" | "auth" | "server" | "unknown";

function classifyStatus(status: number): ErrorKind {
  if (status === 404) return "not-found";
  if (status === 401 || status === 403) return "auth";
  if (status >= 500) return "server";
  return "unknown";
}

// =============================================================================
// Helpers
// =============================================================================

async function snowFetch<T>(
  config: CRMProviderConfig,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${config.lambdaEndpoint}/crm${path}`;
  const timeout = config.timeout ?? 30_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown error");
      const kind = classifyStatus(response.status);
      throw new Error(
        `ServiceNow CRM request failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates a ServiceNow CRM provider that delegates all operations to a
 * Lambda proxy endpoint. The proxy handles ServiceNow REST API auth,
 * table queries, and field mapping between IMS and ServiceNow schemas.
 *
 * @param config - Provider configuration with Lambda endpoint URL
 * @returns ICRMProvider backed by ServiceNow ITSM
 *
 * @example
 * ```ts
 * const crm = createServiceNowCRMProvider({
 *   lambdaEndpoint: "https://xyz.execute-api.us-east-1.amazonaws.com/prod",
 *   instanceId: "sungrow-prod",
 *   timeout: 30000,
 * });
 * ```
 */
export function createServiceNowCRMProvider(config: CRMProviderConfig): ICRMProvider {
  return {
    // TODO: Validate against ServiceNow sys_user response schema during integration testing
    async getCustomer(customerId: string): Promise<CRMCustomer | null> {
      try {
        return await snowFetch<CRMCustomer>(config, `/customers/${customerId}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("[not-found]")) {
          return null;
        }
        throw error;
      }
    },

    // TODO: Validate against ServiceNow table query response during integration testing
    async listCustomers(filters?: {
      region?: string;
      contractType?: string;
    }): Promise<CRMCustomer[]> {
      const params = new URLSearchParams();
      if (filters?.region) params.set("region", filters.region);
      if (filters?.contractType) params.set("contractType", filters.contractType);
      const qs = params.toString();
      return snowFetch<CRMCustomer[]>(config, `/customers${qs ? `?${qs}` : ""}`);
    },

    // TODO: Validate against ServiceNow text search response during integration testing
    async searchCustomers(query: string): Promise<CRMCustomer[]> {
      const params = new URLSearchParams({ q: query });
      return snowFetch<CRMCustomer[]>(config, `/customers/search?${params.toString()}`);
    },

    // TODO: Validate against ServiceNow incident creation response during integration testing
    async createTicket(input: CRMTicketInput): Promise<CRMTicket> {
      return snowFetch<CRMTicket>(config, "/tickets", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    // TODO: Validate against ServiceNow incident update response during integration testing
    async updateTicket(ticketId: string, updates: Partial<CRMTicketInput>): Promise<CRMTicket> {
      return snowFetch<CRMTicket>(config, `/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },

    // TODO: Validate against ServiceNow incident GET response during integration testing
    async getTicket(ticketId: string): Promise<CRMTicket | null> {
      try {
        return await snowFetch<CRMTicket>(config, `/tickets/${ticketId}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("[not-found]")) {
          return null;
        }
        throw error;
      }
    },

    // TODO: Validate against ServiceNow incident list response during integration testing
    async listTickets(filters?: {
      status?: CRMTicket["status"];
      customerId?: string;
      priority?: CRMTicket["priority"];
    }): Promise<CRMTicket[]> {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.customerId) params.set("customerId", filters.customerId);
      if (filters?.priority) params.set("priority", filters.priority);
      const qs = params.toString();
      return snowFetch<CRMTicket[]>(config, `/tickets${qs ? `?${qs}` : ""}`);
    },

    // TODO: Validate against ServiceNow journal entry response during integration testing
    async addTicketComment(
      ticketId: string,
      comment: Omit<CRMComment, "id" | "ticketId" | "createdAt">,
    ): Promise<CRMComment> {
      return snowFetch<CRMComment>(config, `/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify(comment),
      });
    },

    // TODO: Validate against ServiceNow attachment API response during integration testing
    async attachFile(
      ticketId: string,
      file: File | Blob,
      filename: string,
    ): Promise<{ url: string }> {
      const formData = new FormData();
      formData.append("file", file, filename);

      const url = `${config.lambdaEndpoint}/crm/tickets/${ticketId}/attachments`;
      const timeout = config.timeout ?? 30_000;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "Unknown error");
          const kind = classifyStatus(response.status);
          throw new Error(
            `ServiceNow attachment upload failed [${kind}]: ${response.status} ${response.statusText} — ${body}`,
          );
        }

        return (await response.json()) as { url: string };
      } finally {
        clearTimeout(timer);
      }
    },

    // TODO: Validate against ServiceNow import set response during integration testing
    async syncCustomerData(): Promise<CRMSyncResult> {
      return snowFetch<CRMSyncResult>(config, "/sync", {
        method: "POST",
      });
    },
  };
}

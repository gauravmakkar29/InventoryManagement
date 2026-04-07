/**
 * ServiceNow field mapping utilities.
 *
 * Maps IMS CRM domain types to/from ServiceNow table field names.
 * Used by the ServiceNow CRM adapter Lambda to translate payloads.
 *
 * @see Story 20.4 (#386)
 */
import type { CRMTicketInput, CRMTicket, CRMCustomer } from "../types";

// =============================================================================
// ServiceNow field name constants
// =============================================================================

/** ServiceNow incident table field names. */
export const SNOW_FIELDS = {
  // Incident fields
  shortDescription: "short_description",
  description: "description",
  priority: "priority",
  state: "state",
  assignedTo: "assigned_to",
  callerId: "caller_id",
  sysId: "sys_id",
  number: "number",
  sysCreatedOn: "sys_created_on",
  sysUpdatedOn: "sys_updated_on",
  resolvedAt: "resolved_at",
  closeCode: "close_code",

  // Customer / sys_user / account fields
  name: "name",
  email: "email",
  phone: "phone",
  company: "company",
  location: "location",
  contractType: "u_contract_type",
  region: "u_region",
  sites: "u_sites",
} as const;

// =============================================================================
// Priority mapping
// =============================================================================

/** IMS priority → ServiceNow priority integer */
const PRIORITY_TO_SNOW: Record<CRMTicket["priority"], string> = {
  critical: "1",
  high: "2",
  medium: "3",
  low: "4",
};

/** ServiceNow priority integer → IMS priority */
const SNOW_TO_PRIORITY: Record<string, CRMTicket["priority"]> = {
  "1": "critical",
  "2": "high",
  "3": "medium",
  "4": "low",
};

// =============================================================================
// Status mapping
// =============================================================================

/** IMS status → ServiceNow incident state integer */
const STATUS_TO_SNOW: Record<CRMTicket["status"], string> = {
  open: "1",
  "in-progress": "2",
  resolved: "6",
  closed: "7",
};

/** ServiceNow incident state integer → IMS status */
const SNOW_TO_STATUS: Record<string, CRMTicket["status"]> = {
  "1": "open",
  "2": "in-progress",
  "6": "resolved",
  "7": "closed",
};

// =============================================================================
// Mappers — Ticket ↔ Incident
// =============================================================================

/**
 * Map an IMS CRMTicketInput to ServiceNow incident table fields.
 *
 * @param input - IMS ticket creation input
 * @returns Record of ServiceNow field names → values
 */
export function mapTicketToIncident(input: CRMTicketInput): Record<string, string> {
  const fields: Record<string, string> = {
    [SNOW_FIELDS.shortDescription]: input.subject,
    [SNOW_FIELDS.description]: input.description,
    [SNOW_FIELDS.priority]: PRIORITY_TO_SNOW[input.priority] ?? "3",
    [SNOW_FIELDS.callerId]: input.customerId,
  };

  if (input.assignedTo) {
    fields[SNOW_FIELDS.assignedTo] = input.assignedTo;
  }

  return fields;
}

/**
 * Map a ServiceNow incident record to an IMS CRMTicket.
 *
 * @param snow - Raw ServiceNow incident record (field names as keys)
 * @returns CRMTicket domain object
 */
export function mapIncidentToTicket(snow: Record<string, unknown>): CRMTicket {
  const rawPriority = String(snow[SNOW_FIELDS.priority] ?? "3");
  const rawState = String(snow[SNOW_FIELDS.state] ?? "1");

  return {
    id: String(snow[SNOW_FIELDS.sysId] ?? ""),
    customerId: String(snow[SNOW_FIELDS.callerId] ?? ""),
    subject: String(snow[SNOW_FIELDS.shortDescription] ?? ""),
    description: String(snow[SNOW_FIELDS.description] ?? ""),
    status: SNOW_TO_STATUS[rawState] ?? "open",
    priority: SNOW_TO_PRIORITY[rawPriority] ?? "medium",
    assignedTo: snow[SNOW_FIELDS.assignedTo] ? String(snow[SNOW_FIELDS.assignedTo]) : null,
    createdAt: String(snow[SNOW_FIELDS.sysCreatedOn] ?? ""),
    updatedAt: String(snow[SNOW_FIELDS.sysUpdatedOn] ?? ""),
    resolvedAt: snow[SNOW_FIELDS.resolvedAt] ? String(snow[SNOW_FIELDS.resolvedAt]) : null,
  };
}

// =============================================================================
// Mappers — Contact ↔ Customer
// =============================================================================

/**
 * Map a ServiceNow customer/account record to an IMS CRMCustomer.
 *
 * @param snow - Raw ServiceNow sys_user or customer_account record
 * @returns CRMCustomer domain object
 */
export function mapContactToCustomer(snow: Record<string, unknown>): CRMCustomer {
  const rawSites = snow[SNOW_FIELDS.sites];
  const sites: string[] = Array.isArray(rawSites)
    ? rawSites.map(String)
    : typeof rawSites === "string" && rawSites.length > 0
      ? rawSites.split(",").map((s) => s.trim())
      : [];

  return {
    id: String(snow[SNOW_FIELDS.sysId] ?? ""),
    name: String(snow[SNOW_FIELDS.name] ?? ""),
    contactEmail: String(snow[SNOW_FIELDS.email] ?? ""),
    contactPhone: String(snow[SNOW_FIELDS.phone] ?? ""),
    contractType: String(snow[SNOW_FIELDS.contractType] ?? ""),
    region: String(snow[SNOW_FIELDS.region] ?? ""),
    sites,
    createdAt: String(snow[SNOW_FIELDS.sysCreatedOn] ?? ""),
  };
}

// Re-export mapping constants for use in tests and Lambda handlers
export { PRIORITY_TO_SNOW, SNOW_TO_PRIORITY, STATUS_TO_SNOW, SNOW_TO_STATUS };

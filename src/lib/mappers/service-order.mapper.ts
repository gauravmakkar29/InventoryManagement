/**
 * ServiceOrder DTO ↔ ViewModel mapper.
 *
 * Bridges canonical ServiceOrder (types.ts) and mock ServiceOrder (service-order-data.ts).
 */

import type { ServiceOrder as ApiServiceOrder } from "../types";
import type { ServiceOrder as MockServiceOrder, Status } from "../mock-data/service-order-data";

const STATUS_MAP: Record<string, Status> = {
  scheduled: "Scheduled",
  in_progress: "InProgress",
  completed: "Completed",
  cancelled: "Completed", // no direct mapping for cancelled in mock
};

/** API response → UI view model */
export function toServiceOrderViewModel(api: ApiServiceOrder): MockServiceOrder {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    status: STATUS_MAP[api.status] ?? "Scheduled",
    priority: (api.priority.charAt(0).toUpperCase() +
      api.priority.slice(1)) as MockServiceOrder["priority"],
    technician: api.assignedTo,
    scheduledDate: api.scheduledDate,
    serviceType: "Internal",
    location: "",
    customer: api.customerId,
  };
}

/** UI form → API create payload */
export function toServiceOrderCreateDTO(form: MockServiceOrder): Partial<ApiServiceOrder> {
  const statusMap: Record<Status, string> = {
    Scheduled: "scheduled",
    InProgress: "in_progress",
    Completed: "completed",
  };
  return {
    title: form.title,
    description: form.description,
    status: statusMap[form.status] as ApiServiceOrder["status"],
    priority: form.priority.toLowerCase() as ApiServiceOrder["priority"],
    assignedTo: form.technician,
    customerId: form.customer,
    scheduledDate: form.scheduledDate,
    notes: [],
  };
}

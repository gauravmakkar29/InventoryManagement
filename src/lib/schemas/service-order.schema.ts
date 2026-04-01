import { z } from "zod";

/**
 * Zod schema for service order creation.
 */
export const createServiceOrderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  description: z.string().optional(),
  technician: z.string().min(1, "Technician is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  priority: z.enum(["High", "Medium", "Low"]),
  serviceType: z.enum(["Internal", "3rd Party"]),
  location: z.string().min(1, "Location is required"),
  customer: z.string().min(1, "Customer is required"),
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;

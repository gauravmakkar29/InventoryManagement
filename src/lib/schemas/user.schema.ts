import { z } from "zod";

/**
 * Zod schema for user invitation form.
 */
export const inviteUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be under 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be under 50 characters"),
  role: z.enum(["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"]),
  department: z.string().min(1, "Department is required"),
  customer: z.string().optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

/**
 * Zod schema for user edit form.
 */
export const editUserSchema = z.object({
  role: z.enum(["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"]),
  department: z.string().min(1, "Department is required"),
});

export type EditUserInput = z.infer<typeof editUserSchema>;

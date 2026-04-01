import { z } from "zod";

/**
 * Zod schema for device creation form.
 * Used with react-hook-form via @hookform/resolvers/zod.
 *
 * Example:
 * ```tsx
 * const { register, handleSubmit } = useForm<CreateDeviceInput>({
 *   resolver: zodResolver(createDeviceSchema),
 * });
 * ```
 */
export const createDeviceSchema = z.object({
  name: z
    .string()
    .min(1, "Device name is required")
    .max(100, "Device name must be under 100 characters"),
  serial: z
    .string()
    .min(1, "Serial number is required")
    .regex(/^[A-Za-z0-9-]+$/, "Serial must be alphanumeric with dashes"),
  model: z.string().min(1, "Device model is required"),
  firmware: z
    .string()
    .min(1, "Firmware version is required")
    .regex(/^v?\d+\.\d+\.\d+/, "Use format vX.Y.Z"),
  status: z.enum(["Online", "Offline", "Maintenance", "Decommissioned"]),
  location: z.string().min(1, "Location is required"),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

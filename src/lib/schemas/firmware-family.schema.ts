import { z } from "zod";

export const createFirmwareFamilySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").default(""),
  targetModels: z.array(z.string()).min(1, "Select at least one target model"),
});

export type CreateFirmwareFamilyInput = z.infer<typeof createFirmwareFamilySchema>;

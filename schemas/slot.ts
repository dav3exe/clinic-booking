import { z } from "zod";

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "must be an ISO date-time");

export const slotSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  start: isoDate,
  end: isoDate,
});

export const resetSchema = z.object({ slots: z.array(slotSchema) });

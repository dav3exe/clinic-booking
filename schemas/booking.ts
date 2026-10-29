import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const newBookingSchema = z.object({
  slot_id: z.string({ error: "slot_id is required" }).trim().min(1, "slot_id is required"),
  name: z
    .string({ error: "name is required" })
    .trim()
    .min(1, "name is required")
    .max(200, "name is too long"),
  email: z
    .string({ error: "email is required" })
    .trim()
    .min(1, "email is required")
    .max(254, "email is too long")
    .regex(EMAIL_PATTERN, "email is not valid")
    .transform((value) => value.toLowerCase()),
});

export type NewBookingInput = z.infer<typeof newBookingSchema>;

export const listBookingsQuerySchema = z.object({
  email: z.string({ error: "email is required" }).trim().min(1, "email is required"),
  limit: z
    .string()
    .regex(/^\d+$/, "limit must be an integer between 1 and 50")
    .transform(Number)
    .refine((n) => n >= 1 && n <= 50, "limit must be an integer between 1 and 50")
    .optional(),
  cursor: z.string().min(1, "cursor is invalid").optional(),
});

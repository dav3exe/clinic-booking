import { z } from "zod";

// Mirrors the backend newBookingSchema field names (slot_id is supplied by the selected slot, not typed).
export const bookingFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(200, "Name is too long"),
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

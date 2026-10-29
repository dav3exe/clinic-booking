import { route } from "@/lib/api";
import { createBookingController, listBookingsController } from "@/controllers/bookings-controller";

// Keyless twin of /bookings for the clinic web page. Same controllers, so same validation, idempotency and rate limit.
export const POST = route(createBookingController, { auth: false });
export const GET = route(listBookingsController, { auth: false });

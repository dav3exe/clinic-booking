import { route } from "@/lib/api";
import { createBookingController, listBookingsNewestFirstController } from "@/controllers/bookings-controller";

// Keyless twin of /bookings for the clinic web page. Same controllers, so same validation, idempotency and rate limit.
// The one difference: the web page lists a person's bookings newest first.
export const POST = route(createBookingController, { auth: false });
export const GET = route(listBookingsNewestFirstController, { auth: false });

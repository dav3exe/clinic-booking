import { preflight, route } from "@/lib/api";
import { createBookingController, listBookingsController } from "@/controllers/bookings-controller";

export const POST = route(createBookingController);
export const GET = route(listBookingsController);
export const OPTIONS = preflight;

import { preflight, route } from "@/lib/api";
import { cancelBookingController, getBookingController } from "@/controllers/bookings-controller";

export const GET = route(getBookingController);
export const DELETE = route(cancelBookingController);
export const OPTIONS = preflight;

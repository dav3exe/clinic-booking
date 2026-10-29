import { route } from "@/lib/api";
import { cancelBookingController, getBookingController } from "@/controllers/bookings-controller";

export const GET = route(getBookingController, { auth: false });
export const DELETE = route(cancelBookingController, { auth: false });

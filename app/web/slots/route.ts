import { route } from "@/lib/api";
import { listSlotsController } from "@/controllers/slots-controller";

// Keyless twin of /slots for the clinic web page, so the API key never ships to the browser.
export const GET = route(listSlotsController, { auth: false });

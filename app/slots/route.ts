import { preflight, route } from "@/lib/api";
import { listSlotsController } from "@/controllers/slots-controller";

export const GET = route(listSlotsController);
export const OPTIONS = preflight;

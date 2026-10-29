import { preflight, route } from "@/lib/api";
import { resetController } from "@/controllers/slots-controller";

export const POST = route(resetController);
export const OPTIONS = preflight;

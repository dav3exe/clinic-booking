import { json, readJson, type RouteContext } from "@/lib/api";
import { cancelBooking, createBooking, getBooking, listBookings } from "@/services/booking-service";

export async function createBookingController(req: Request): Promise<Response> {
  const body = await readJson(req);
  const result = await createBooking(body, req.headers.get("idempotency-key")?.trim() || null);
  return json(result.body, result.status);
}

async function listBookingsResponse(req: Request, newestFirst: boolean): Promise<Response> {
  const params = new URL(req.url).searchParams;
  return json(
    await listBookings(
      {
        email: params.get("email") ?? undefined,
        limit: params.get("limit") ?? undefined,
        cursor: params.get("cursor") ?? undefined,
      },
      { newestFirst },
    ),
  );
}

/** Public API: oldest first, as the spec requires. */
export const listBookingsController = (req: Request) => listBookingsResponse(req, false);

/** Clinic web page: newest first, so the latest booking is at the top. */
export const listBookingsNewestFirstController = (req: Request) => listBookingsResponse(req, true);

export async function getBookingController(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  return json(await getBooking(id));
}

export async function cancelBookingController(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  return json(await cancelBooking(id));
}

import { json, readJson, type RouteContext } from "@/lib/api";
import { cancelBooking, createBooking, getBooking, listBookings } from "@/services/booking-service";

export async function createBookingController(req: Request): Promise<Response> {
  const body = await readJson(req);
  const result = await createBooking(body, req.headers.get("idempotency-key")?.trim() || null);
  return json(result.body, result.status);
}

export async function listBookingsController(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams;
  return json(
    await listBookings({
      email: params.get("email") ?? undefined,
      limit: params.get("limit") ?? undefined,
      cursor: params.get("cursor") ?? undefined,
    }),
  );
}

export async function getBookingController(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  return json(await getBooking(id));
}

export async function cancelBookingController(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  return json(await cancelBooking(id));
}

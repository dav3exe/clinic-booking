import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import { BookingModel, type BookingDoc } from "@/models/booking";
import { SlotModel } from "@/models/slot";
import { listBookingsQuerySchema, newBookingSchema } from "@/schemas/booking";
import { claim, complete, release, type StoredResponse } from "@/services/idempotency-service";
import { consumeAttempt } from "@/services/rate-limit-service";

export type BookingView = {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};

function toView(doc: BookingDoc): BookingView {
  return {
    id: doc._id,
    slot_id: doc.slot_id,
    name: doc.name,
    email: doc.email,
    status: doc.status as BookingView["status"],
    created_at: doc.created_at.toISOString(),
  };
}

const fail = (status: number, message: string): StoredResponse => ({ status, body: { error: message } });

/** Stable JSON (sorted keys) so key order in the request body never changes the fingerprint. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

const fingerprintOf = (body: unknown) => createHash("sha256").update(canonical(body)).digest("hex");

/** Email used for rate limiting, even when the rest of the body is invalid ("failed attempts included"). */
function emailForRateLimit(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const email = (body as { email?: unknown }).email;
  if (typeof email !== "string") return null;
  const normalised = email.trim().toLowerCase();
  return normalised ? normalised : null;
}

/** One booking attempt. Deterministic outcomes are returned (so they can be replayed); 429 is thrown. */
async function attemptBooking(body: unknown): Promise<StoredResponse> {
  const email = emailForRateLimit(body);
  if (email) await consumeAttempt(email);

  const parsed = newBookingSchema.safeParse(body);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "invalid request body");
  const input = parsed.data;

  const slot = await SlotModel.findById(input.slot_id).lean();
  if (!slot) return fail(404, "slot not found");
  if (slot.startAt.getTime() <= Date.now()) return fail(400, "slot has already started");

  try {
    const booking = await BookingModel.create({
      _id: `bk_${randomUUID()}`,
      slot_id: input.slot_id,
      name: input.name,
      email: input.email,
      status: "confirmed",
      created_at: new Date(),
    });
    return { status: 201, body: toView(booking.toObject() as BookingDoc) };
  } catch (err) {
    // The partial unique index on confirmed bookings decides the winner when requests race.
    if ((err as { code?: number }).code === 11000) return fail(409, "slot is already booked");
    throw err;
  }
}

export async function createBooking(body: unknown, idempotencyKey: string | null): Promise<StoredResponse> {
  if (!idempotencyKey) return attemptBooking(body);

  if (idempotencyKey.length > 255) throw new ApiError(400, "Idempotency-Key is too long");

  const outcome = await claim(idempotencyKey, fingerprintOf(body));
  if (outcome.kind === "mismatch") {
    return fail(422, "Idempotency-Key was already used with a different request body");
  }
  if (outcome.kind === "replay") return outcome.stored;

  try {
    const result = await attemptBooking(body);
    await complete(idempotencyKey, result);
    return result;
  } catch (err) {
    await release(idempotencyKey).catch(() => undefined);
    throw err;
  }
}

export async function getBooking(id: string): Promise<BookingView> {
  const doc = await BookingModel.findById(id).lean();
  if (!doc) throw new ApiError(404, "booking not found");
  return toView(doc);
}

export async function cancelBooking(id: string): Promise<BookingView> {
  // Only a confirmed booking can flip to cancelled; this is atomic, so a double cancel yields one 200 and one 409.
  const cancelled = await BookingModel.findOneAndUpdate(
    { _id: id, status: "confirmed" },
    { $set: { status: "cancelled" } },
    { returnDocument: "after" },
  ).lean();
  if (cancelled) return toView(cancelled);

  const exists = await BookingModel.exists({ _id: id });
  if (!exists) throw new ApiError(404, "booking not found");
  throw new ApiError(409, "booking is already cancelled");
}

type Cursor = { t: number; i: string };

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(raw: string): Cursor {
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<Cursor>;
    if (typeof value.t === "number" && Number.isFinite(value.t) && typeof value.i === "string") {
      return { t: value.t, i: value.i };
    }
  } catch {
    // fall through
  }
  throw new ApiError(400, "cursor is invalid");
}

/**
 * A person's bookings, a page at a time. The public API is oldest first (as the spec requires);
 * the clinic web page asks for newest first so the latest booking sits at the top.
 */
export async function listBookings(
  query: Record<string, string | undefined>,
  { newestFirst = false }: { newestFirst?: boolean } = {},
) {
  const parsed = listBookingsQuerySchema.safeParse(query);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "invalid query");

  const email = parsed.data.email.toLowerCase();
  const limit = parsed.data.limit ?? 10;
  const filter: Record<string, unknown> = { email };
  const after = newestFirst ? "$lt" : "$gt";
  const direction = newestFirst ? -1 : 1;

  if (parsed.data.cursor) {
    const { t, i } = decodeCursor(parsed.data.cursor);
    filter.$or = [{ created_at: { [after]: new Date(t) } }, { created_at: new Date(t), _id: { [after]: i } }];
  }

  // Fetch one extra row to know whether another page exists without a second count query.
  const rows = await BookingModel.find(filter)
    .sort({ created_at: direction, _id: direction })
    .limit(limit + 1)
    .lean();
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  return {
    bookings: page.map(toView),
    next_cursor:
      rows.length > limit && last ? encodeCursor({ t: last.created_at.getTime(), i: last._id }) : null,
  };
}

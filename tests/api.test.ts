import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const KEY = "test-key";
type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
let mongod: MongoMemoryServer;
let slotsRoute: { GET: Handler };
let resetRoute: { POST: Handler };
let bookingsRoute: { GET: Handler; POST: Handler };
let bookingRoute: { GET: Handler; DELETE: Handler };

const future = (days: number, hour = 9) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
const SLOTS = [
  { id: "s1", provider: "Dr Ade", start: future(3, 9), end: future(3, 10) },
  { id: "s2", provider: "Dr Ade", start: future(3, 11), end: future(3, 12) },
  { id: "s3", provider: "Dr Bisi", start: future(2, 9), end: future(2, 10) },
  { id: "past", provider: "Dr Ade", start: "2020-01-01T09:00:00Z", end: "2020-01-01T09:30:00Z" },
];

function call(handler: Handler, path: string, init: RequestInit & { key?: string | null } = {}, params = {}) {
  const { key = KEY, headers, ...rest } = init;
  const h = new Headers(headers);
  if (key !== null) h.set("x-api-key", key);
  if (rest.body) h.set("content-type", "application/json");
  return handler(new Request(`http://test${path}`, { ...rest, headers: h }), { params: Promise.resolve(params) });
}
const post = (body: unknown, headers: Record<string, string> = {}) =>
  call(bookingsRoute.POST, "/bookings", { method: "POST", body: JSON.stringify(body), headers });
const book = (slot_id: string, email = "ada@example.com", name = "Ada Obi") => post({ slot_id, name, email });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("clinic");
  process.env.API_KEY = KEY;
  slotsRoute = await import("@/app/slots/route");
  resetRoute = await import("@/app/reset/route");
  bookingsRoute = await import("@/app/bookings/route");
  bookingRoute = await import("@/app/bookings/[id]/route");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const res = await call(resetRoute.POST, "/reset", { method: "POST", body: JSON.stringify({ slots: SLOTS }) });
  expect(res.status).toBe(200);
});

describe("level 1-2: slots, booking, auth, validation", () => {
  it("lists slots earliest first with availability and filters by provider", async () => {
    const all = await (await call(slotsRoute.GET, "/slots")).json();
    expect(all.slots.map((s: { id: string }) => s.id)).toEqual(["past", "s3", "s1", "s2"]);
    expect(all.slots[2]).toEqual({ ...SLOTS[0], available: true });
    const ade = await (await call(slotsRoute.GET, "/slots?provider=Dr%20Ade")).json();
    expect(ade.slots).toHaveLength(3);
  });

  it("books, then looks the booking up", async () => {
    const res = await book("s1", "  ADA@Example.com ", "  Ada Obi ");
    expect(res.status).toBe(201);
    const booking = await res.json();
    expect(booking).toMatchObject({ slot_id: "s1", name: "Ada Obi", email: "ada@example.com", status: "confirmed" });
    const got = await call(bookingRoute.GET, `/bookings/${booking.id}`, {}, { id: booking.id });
    expect(await got.json()).toEqual(booking);
    const slots = await (await call(slotsRoute.GET, "/slots")).json();
    expect(slots.slots.find((s: { id: string }) => s.id === "s1").available).toBe(false);
  });

  it("404s an unknown booking", async () => {
    const res = await call(bookingRoute.GET, "/bookings/nope", {}, { id: "nope" });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("rejects a missing or wrong API key with 401 on every endpoint", async () => {
    for (const key of [null, "wrong"]) {
      expect((await call(slotsRoute.GET, "/slots", { key })).status).toBe(401);
      expect((await call(bookingsRoute.GET, "/bookings?email=a@b.co", { key })).status).toBe(401);
      expect((await call(resetRoute.POST, "/reset", { method: "POST", body: "{}", key })).status).toBe(401);
      expect((await call(bookingRoute.GET, "/bookings/x", { key }, { id: "x" })).status).toBe(401);
    }
  });

  it("validates the body, the slot and the start time", async () => {
    expect((await post({ name: "A", email: "a@b.co" })).status).toBe(400);
    expect((await post({ slot_id: "s1", name: "   ", email: "a@b.co" })).status).toBe(400);
    expect((await post({ slot_id: "s1", name: "A", email: "" })).status).toBe(400);
    expect((await post({ slot_id: "s1", name: "A", email: "not-an-email" })).status).toBe(400);
    expect((await post({ slot_id: 5, name: "A", email: "a@b.co" })).status).toBe(400);
    expect((await post("nonsense")).status).toBe(400);
    expect((await book("missing", "x@b.co")).status).toBe(404);
    expect((await book("past", "y@b.co")).status).toBe(400);
  });
});

describe("level 3: no double booking, cancel", () => {
  it("lets exactly one of many simultaneous requests win", async () => {
    const results = await Promise.all(Array.from({ length: 25 }, (_, i) => book("s2", `p${i}@example.com`)));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(24);
  });

  it("cancels, frees the slot, rejects a second cancel and allows rebooking", async () => {
    const first = await (await book("s1")).json();
    expect((await book("s1", "other@example.com")).status).toBe(409);
    const cancelled = await call(bookingRoute.DELETE, `/bookings/${first.id}`, { method: "DELETE" }, { id: first.id });
    expect(cancelled.status).toBe(200);
    expect((await cancelled.json()).status).toBe("cancelled");
    expect((await call(bookingRoute.DELETE, `/bookings/${first.id}`, { method: "DELETE" }, { id: first.id })).status).toBe(409);
    expect((await call(bookingRoute.DELETE, "/bookings/nope", { method: "DELETE" }, { id: "nope" })).status).toBe(404);
    expect((await book("s1", "other@example.com")).status).toBe(201);
  });
});

describe("level 4: idempotency and pagination", () => {
  it("replays the same response for the same key and body", async () => {
    const body = { slot_id: "s1", name: "Ada", email: "ada@example.com" };
    const a = await post(body, { "Idempotency-Key": "k1" });
    const b = await post(body, { "Idempotency-Key": "k1" });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect((await b.json()).id).toBe((await a.json()).id);
    const list = await (await call(bookingsRoute.GET, "/bookings?email=ada@example.com")).json();
    expect(list.bookings).toHaveLength(1);
  });

  it("replays a stored failure with the same status", async () => {
    await book("s1", "first@example.com");
    const body = { slot_id: "s1", name: "B", email: "b@example.com" };
    expect((await post(body, { "Idempotency-Key": "k2" })).status).toBe(409);
    expect((await post(body, { "Idempotency-Key": "k2" })).status).toBe(409);
  });

  it("returns 422 for the same key with a different body", async () => {
    await post({ slot_id: "s1", name: "Ada", email: "ada@example.com" }, { "Idempotency-Key": "k3" });
    const res = await post({ slot_id: "s2", name: "Ada", email: "ada@example.com" }, { "Idempotency-Key": "k3" });
    expect(res.status).toBe(422);
  });

  it("creates one booking when the same key arrives many times at once", async () => {
    const body = { slot_id: "s3", name: "Ada", email: "race@example.com" };
    const res = await Promise.all(Array.from({ length: 10 }, () => post(body, { "Idempotency-Key": "k4" })));
    const bodies = await Promise.all(res.map((r) => r.json()));
    expect(res.every((r) => r.status === 201)).toBe(true);
    expect(new Set(bodies.map((b) => b.id)).size).toBe(1);
  });

  it("pages through a person's bookings oldest first, ignoring email case", async () => {
    await call(resetRoute.POST, "/reset", {
      method: "POST",
      body: JSON.stringify({
        slots: Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, provider: "Dr Ade", start: future(5 + i), end: future(5 + i, 10) })),
      }),
    });
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push((await (await book(`m${i}`, "pager@example.com")).json()).id);

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const url: string = `/bookings?email=PAGER@example.com&limit=2${cursor ? `&cursor=${cursor}` : ""}`;
      const page: { bookings: { id: string }[]; next_cursor: string | null } = await (await call(bookingsRoute.GET, url)).json();
      seen.push(...page.bookings.map((b) => b.id));
      cursor = page.next_cursor;
      pages++;
    } while (cursor);
    expect(pages).toBe(3);
    expect(seen).toEqual(ids);
  });

  it("lists newest first on the web page route, cancelled ones included", async () => {
    const webBookingsRoute: { GET: Handler } = await import("@/app/web/bookings/route");
    await call(resetRoute.POST, "/reset", {
      method: "POST",
      body: JSON.stringify({
        slots: Array.from({ length: 5 }, (_, i) => ({ id: `w${i}`, provider: "Dr Ade", start: future(5 + i), end: future(5 + i, 10) })),
      }),
    });
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push((await (await book(`w${i}`, "web@example.com")).json()).id);
    await call(bookingRoute.DELETE, `/bookings/${ids[1]}`, { method: "DELETE" }, { id: ids[1] });

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const url: string = `/web/bookings?email=web@example.com&limit=2${cursor ? `&cursor=${cursor}` : ""}`;
      const page: { bookings: { id: string }[]; next_cursor: string | null } = await (
        await call(webBookingsRoute.GET, url, { key: null })
      ).json();
      seen.push(...page.bookings.map((b) => b.id));
      cursor = page.next_cursor;
    } while (cursor);
    expect(seen).toEqual([...ids].reverse());
  });

  it("rejects bad limits, a missing email and a bad cursor", async () => {
    for (const q of ["limit=0", "limit=51", "limit=abc", "limit=1.5"]) {
      expect((await call(bookingsRoute.GET, `/bookings?email=a@b.co&${q}`)).status).toBe(400);
    }
    expect((await call(bookingsRoute.GET, "/bookings")).status).toBe(400);
    expect((await call(bookingsRoute.GET, "/bookings?email=a@b.co&cursor=%%%")).status).toBe(400);
    const empty = await (await call(bookingsRoute.GET, "/bookings?email=nobody@b.co")).json();
    expect(empty).toEqual({ bookings: [], next_cursor: null });
  });
});

describe("level 5: rate limit", () => {
  it("allows 5 attempts per email per minute, failed ones included, then 429 with Retry-After", async () => {
    for (let i = 0; i < 5; i++) expect((await book("missing", "spam@example.com")).status).toBe(404);
    const blocked = await book("s1", "spam@example.com");
    expect(blocked.status).toBe(429);
    const retry = Number(blocked.headers.get("retry-after"));
    expect(Number.isInteger(retry)).toBe(true);
    expect(retry).toBeGreaterThanOrEqual(1);
    expect(retry).toBeLessThanOrEqual(60);
    expect((await book("s1", "SPAM@example.com")).status).toBe(429);
    expect((await book("s1", "someone-else@example.com")).status).toBe(201);
  });

  it("holds under concurrency", async () => {
    const res = await Promise.all(Array.from({ length: 20 }, () => book("missing", "burst@example.com")));
    expect(res.filter((r) => r.status === 404)).toHaveLength(5);
    expect(res.filter((r) => r.status === 429)).toHaveLength(15);
  });
});

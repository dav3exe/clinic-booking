import { ApiError } from "@/lib/api";
import { IdempotencyModel } from "@/models/idempotency-record";

const STALE_PENDING_MS = 15_000;
const WAIT_LIMIT_MS = 10_000;
const POLL_MS = 50;

export type StoredResponse = { status: number; body: unknown };

export type Claim =
  | { kind: "owner" }
  | { kind: "replay"; stored: StoredResponse }
  | { kind: "mismatch" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Atomically claims an Idempotency-Key by inserting it (the key is the primary key).
 * - We won the insert: we are the owner and must process the request, then call complete() or release().
 * - Someone else holds it: a different body is a mismatch (422); the same body replays the stored response,
 *   waiting briefly if the first request is still in flight.
 */
export async function claim(key: string, fingerprint: string): Promise<Claim> {
  const deadline = Date.now() + WAIT_LIMIT_MS;

  while (Date.now() < deadline) {
    try {
      await IdempotencyModel.create({ _id: key, fingerprint, state: "pending", createdAt: new Date() });
      return { kind: "owner" };
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }

    const existing = await IdempotencyModel.findById(key).lean();
    if (!existing) continue; // released between our insert and our read; try to claim again

    if (existing.fingerprint !== fingerprint) return { kind: "mismatch" };
    if (existing.state === "done") {
      return { kind: "replay", stored: { status: existing.status ?? 500, body: existing.body } };
    }

    // The owner may have crashed mid-request; free a long-stale claim so retries are not blocked forever.
    if (Date.now() - existing.createdAt.getTime() > STALE_PENDING_MS) {
      await IdempotencyModel.deleteOne({
        _id: key,
        state: "pending",
        createdAt: { $lt: new Date(Date.now() - STALE_PENDING_MS) },
      });
      continue;
    }
    await sleep(POLL_MS);
  }

  throw new ApiError(409, "a request with this Idempotency-Key is still being processed");
}

export async function complete(key: string, stored: StoredResponse): Promise<void> {
  await IdempotencyModel.updateOne(
    { _id: key },
    { $set: { state: "done", status: stored.status, body: stored.body } },
  );
}

/** Frees the key so the client can retry (used for unexpected errors and 429s, which are never replayed). */
export async function release(key: string): Promise<void> {
  await IdempotencyModel.deleteOne({ _id: key });
}

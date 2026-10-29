import { ApiError } from "@/lib/api";
import { RateLimitModel } from "@/models/rate-limit";

export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 60_000;

/**
 * Counts one booking attempt for this email in a sliding window and throws 429 when the limit is hit.
 * The filter-check-append happens in a single aggregation-pipeline update on one document,
 * so concurrent requests (even across serverless instances) cannot slip past the limit.
 * Rejected attempts are not recorded, so a spammer's lockout ends 60s after their last *counted* attempt.
 */
export async function consumeAttempt(email: string): Promise<void> {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  for (let retry = 0; retry < 3; retry++) {
    try {
      const doc = await RateLimitModel.findOneAndUpdate(
        { _id: email },
        [
          {
            $set: {
              hits: {
                $filter: {
                  input: { $ifNull: ["$hits", []] },
                  as: "hit",
                  cond: { $gt: ["$$hit", cutoff] },
                },
              },
            },
          },
          { $set: { allowed: { $lt: [{ $size: "$hits" }, MAX_ATTEMPTS] } } },
          {
            $set: {
              hits: { $cond: ["$allowed", { $concatArrays: ["$hits", [now]] }, "$hits"] },
              updatedAt: new Date(now),
            },
          },
        ],
        { upsert: true, returnDocument: "after", updatePipeline: true },
      ).lean();

      if (doc?.allowed) return;

      const oldest = Math.min(...(doc?.hits ?? [now]));
      const retryAfter = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
      throw new ApiError(429, "too many booking attempts for this email, try again later", {
        "Retry-After": String(retryAfter),
      });
    } catch (err) {
      // Two first-ever attempts racing to upsert the same email: one gets a duplicate key, retry it.
      if (err instanceof ApiError || (err as { code?: number }).code !== 11000) throw err;
    }
  }
  throw new Error("rate limit upsert kept conflicting");
}

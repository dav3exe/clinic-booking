import { BookingModel } from "@/models/booking";
import { IdempotencyModel } from "@/models/idempotency-record";
import { RateLimitModel } from "@/models/rate-limit";
import { SlotModel } from "@/models/slot";
import { ApiError } from "@/lib/api";

export type SlotInput = { id: string; provider: string; start: string; end: string };
export type SlotView = SlotInput & { available: boolean };

/** Wipes bookings, idempotency records and rate-limit counters, then replaces every slot. */
export async function resetSlots(slots: SlotInput[]): Promise<void> {
  const ids = new Set(slots.map((slot) => slot.id));
  if (ids.size !== slots.length) throw new ApiError(400, "slot ids must be unique");

  await Promise.all([
    BookingModel.deleteMany({}),
    IdempotencyModel.deleteMany({}),
    RateLimitModel.deleteMany({}),
    SlotModel.deleteMany({}),
  ]);
  if (slots.length === 0) return;
  await SlotModel.insertMany(
    slots.map((slot) => ({
      _id: slot.id,
      provider: slot.provider,
      start: slot.start,
      end: slot.end,
      startAt: new Date(slot.start),
    })),
  );
}

export async function listSlots(provider?: string): Promise<SlotView[]> {
  const slots = await SlotModel.find(provider ? { provider } : {})
    .sort({ startAt: 1, _id: 1 })
    .lean();
  const booked = new Set(
    await BookingModel.distinct("slot_id", {
      status: "confirmed",
      slot_id: { $in: slots.map((slot) => slot._id) },
    }),
  );
  return slots.map((slot) => ({
    id: slot._id,
    provider: slot.provider,
    start: slot.start,
    end: slot.end,
    available: !booked.has(slot._id),
  }));
}

import mongoose, { type InferSchemaType } from "mongoose";

const rateLimitSchema = new mongoose.Schema(
  {
    // One document per email (lower-cased).
    _id: { type: String, required: true },
    // Epoch ms of each counted attempt inside the sliding window.
    hits: { type: [Number], default: [] },
    allowed: { type: Boolean },
    updatedAt: { type: Date, expires: 60 * 60 },
  },
  { versionKey: false },
);

export type RateLimitDoc = InferSchemaType<typeof rateLimitSchema> & { _id: string };

export const RateLimitModel =
  (mongoose.models.RateLimit as mongoose.Model<RateLimitDoc>) ??
  mongoose.model<RateLimitDoc>("RateLimit", rateLimitSchema);

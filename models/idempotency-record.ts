import mongoose, { type InferSchemaType } from "mongoose";

const idempotencySchema = new mongoose.Schema(
  {
    // The Idempotency-Key itself; the primary key makes "claim" an atomic insert.
    _id: { type: String, required: true },
    fingerprint: { type: String, required: true },
    state: { type: String, enum: ["pending", "done"], required: true },
    status: { type: Number },
    body: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, required: true, expires: 60 * 60 * 24 },
  },
  { versionKey: false },
);

export type IdempotencyDoc = InferSchemaType<typeof idempotencySchema> & { _id: string };

export const IdempotencyModel =
  (mongoose.models.IdempotencyRecord as mongoose.Model<IdempotencyDoc>) ??
  mongoose.model<IdempotencyDoc>("IdempotencyRecord", idempotencySchema);

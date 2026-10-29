import mongoose, { type InferSchemaType } from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    provider: { type: String, required: true },
    // Original strings are returned to clients untouched; startAt is the Date copy for sorting and comparing.
    start: { type: String, required: true },
    end: { type: String, required: true },
    startAt: { type: Date, required: true },
  },
  { versionKey: false },
);

slotSchema.index({ startAt: 1, _id: 1 });
slotSchema.index({ provider: 1, startAt: 1 });

export type SlotDoc = InferSchemaType<typeof slotSchema> & { _id: string };

export const SlotModel =
  (mongoose.models.Slot as mongoose.Model<SlotDoc>) ?? mongoose.model<SlotDoc>("Slot", slotSchema);

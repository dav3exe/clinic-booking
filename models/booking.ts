import mongoose, { type InferSchemaType } from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    slot_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], required: true },
    created_at: { type: Date, required: true },
  },
  { versionKey: false },
);

// The final guard against double booking: only one *confirmed* booking per slot, enforced by the database.
bookingSchema.index({ slot_id: 1 }, { unique: true, partialFilterExpression: { status: "confirmed" } });
// Serves the paginated "my bookings" query (email, then oldest first).
bookingSchema.index({ email: 1, created_at: 1, _id: 1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: string };

export const BookingModel =
  (mongoose.models.Booking as mongoose.Model<BookingDoc>) ??
  mongoose.model<BookingDoc>("Booking", bookingSchema);

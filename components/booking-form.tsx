"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { formatDayHeading, formatRange } from "@/components/format";
import { createBooking, type Booking, type Slot } from "@/lib/web-client";
import { bookingFormSchema, type BookingFormValues } from "@/schemas/booking-form";

type BookingFormProps = { slot: Slot; onBooked: (booking: Booking) => void; onCancel: () => void };

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-background px-3.5 py-2.5 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 ${
    invalid ? "border-red-500" : "border-line"
  }`;

export function BookingForm({ slot, onBooked, onCancel }: BookingFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { name: "", email: "" },
  });

  // One Idempotency-Key per distinct request body: a retried submit replays, an edited one gets a new key.
  const keyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const keyFor = (fingerprint: string) => {
    if (keyRef.current?.fingerprint !== fingerprint) {
      keyRef.current = { fingerprint, key: crypto.randomUUID() };
    }
    return keyRef.current.key;
  };

  const mutation = useMutation({
    mutationFn: (values: BookingFormValues) => {
      const body = { slot_id: slot.id, name: values.name, email: values.email };
      return createBooking(body, keyFor(JSON.stringify(body)));
    },
    onSuccess: (booking) => {
      keyRef.current = null;
      toast.success("Appointment booked");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onBooked(booking);
    },
    onError: (error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="animate-rise overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
    >
      <div className="border-b border-line bg-teal-50/60 p-5 dark:bg-teal-950/20">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">Your appointment</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={slot.provider} />
          <div>
            <p className="font-semibold">{slot.provider}</p>
            <p className="text-sm text-muted">
              {formatDayHeading(slot.start)} · {formatRange(slot.start, slot.end)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            autoComplete="name"
            placeholder="Ada Obi"
            aria-invalid={!!errors.name}
            className={inputClass(!!errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ada@example.com"
            aria-invalid={!!errors.email}
            className={inputClass(!!errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">Use this email to find or cancel your booking later.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
        >
          {mutation.isPending && (
            <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {mutation.isPending ? "Booking…" : "Confirm booking"}
        </button>
        <button type="button" onClick={onCancel} className="w-full text-sm text-muted hover:text-foreground">
          Choose a different time
        </button>
      </div>
    </form>
  );
}

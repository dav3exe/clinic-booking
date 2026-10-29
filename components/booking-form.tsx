"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { FormField } from "@/components/form-field";
import { formatDayHeading, formatRange } from "@/components/format";
import { createBooking, type Booking, type Slot } from "@/lib/web-client";
import { bookingFormSchema, type BookingFormValues } from "@/schemas/booking-form";

type BookingFormProps = { slot: Slot; titleId: string; onBooked: (booking: Booking) => void; onCancel: () => void };

export function BookingForm({ slot, titleId, onBooked, onCancel }: BookingFormProps) {
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
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="p-6 sm:p-8">
      <h2 id={titleId} className="pr-10 font-display text-2xl font-bold tracking-tight">
        Confirm your visit
      </h2>
      <p className="mt-1 text-sm text-muted">Just your name and email and you&apos;re all set.</p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-mint p-4">
        <Avatar name={slot.provider} size="lg" />
        <div>
          <p className="font-display text-lg font-semibold">{slot.provider}</p>
          <p className="text-sm text-foreground/75">{formatDayHeading(slot.start)}</p>
          <p className="text-sm font-semibold text-brand">{formatRange(slot.start, slot.end)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Ada Obi"
          error={errors.name?.message}
          {...register("name")}
        />
        <FormField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="ada@example.com"
          error={errors.email?.message}
          hint="You'll use this email to find or cancel your booking."
          {...register("email")}
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
      >
        {mutation.isPending && (
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        )}
        {mutation.isPending ? "Booking…" : "Book appointment"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-3 w-full rounded-full py-2 text-sm font-semibold text-muted transition hover:text-foreground"
      >
        Choose a different time
      </button>
    </form>
  );
}

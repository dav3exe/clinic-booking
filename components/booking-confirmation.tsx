"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { formatDayHeading, formatRange } from "@/components/format";
import type { Booking, Slot } from "@/lib/web-client";

type BookingConfirmationProps = {
  booking: Booking;
  slot: Slot;
  titleId: string;
  onDone: () => void;
  onViewBookings: () => void;
};

export function BookingConfirmation({ booking, slot, titleId, onDone, onViewBookings }: BookingConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context); the reference is still visible to copy by hand.
    }
  };

  return (
    <div role="status" className="p-6 sm:p-8">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
          <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 id={titleId} className="mt-4 font-display text-2xl font-bold tracking-tight">
        You&apos;re booked
      </h2>
      <p className="mt-1 text-sm text-muted">
        See you soon, {booking.name.split(" ")[0]}. Your visit with {slot.provider} is confirmed.
      </p>

      <div className="mt-6 rounded-2xl bg-mint p-4">
        <div className="flex items-center gap-4">
          <Avatar name={slot.provider} size="lg" />
          <div>
            <p className="font-display text-lg font-semibold">{slot.provider}</p>
            <p className="text-sm text-foreground/75">{formatDayHeading(slot.start)}</p>
            <p className="text-sm font-semibold text-brand">{formatRange(slot.start, slot.end)}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-brand/15 pt-4 text-sm">
          <dt className="text-muted">Name</dt>
          <dd className="font-medium">{booking.name}</dd>
          <dt className="text-muted">Email</dt>
          <dd className="break-all font-medium">{booking.email}</dd>
        </dl>
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Booking reference</p>
        <div className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-4 pr-1.5">
          <code className="min-w-0 flex-1 truncate font-mono text-xs">{booking.id}</code>
          <button
            onClick={copy}
            className="shrink-0 rounded-full bg-mint px-3 py-1 text-xs font-semibold transition hover:bg-brand-soft"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-2 sm:grid-cols-2">
        <button
          onClick={onViewBookings}
          className="rounded-full border border-line px-4 py-3 text-sm font-semibold transition hover:bg-mint"
        >
          My bookings
        </button>
        <button
          onClick={onDone}
          className="rounded-full bg-brand px-4 py-3 text-sm font-semibold text-on-brand transition hover:bg-brand-strong"
        >
          Done
        </button>
      </div>
    </div>
  );
}

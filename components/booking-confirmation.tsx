"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { formatDayHeading, formatRange } from "@/components/format";
import type { Booking, Slot } from "@/lib/web-client";

type BookingConfirmationProps = {
  booking: Booking;
  slot: Slot;
  onDone: () => void;
  onViewBookings: () => void;
};

export function BookingConfirmation({ booking, slot, onDone, onViewBookings }: BookingConfirmationProps) {
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
    <div role="status" className="animate-rise overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="bg-teal-600 p-5 text-white">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-white/20">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-3 text-xl font-semibold">You&apos;re booked</h2>
        <p className="text-sm text-teal-50">We&apos;ve saved your appointment.</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={slot.provider} />
          <div>
            <p className="font-semibold">{slot.provider}</p>
            <p className="text-sm text-muted">
              {formatDayHeading(slot.start)} · {formatRange(slot.start, slot.end)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-background p-4 text-sm">
          <dt className="text-muted">Name</dt>
          <dd className="font-medium">{booking.name}</dd>
          <dt className="text-muted">Email</dt>
          <dd className="break-all font-medium">{booking.email}</dd>
          <dt className="text-muted">Status</dt>
          <dd>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium capitalize text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
              {booking.status}
            </span>
          </dd>
        </dl>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Booking reference</p>
          <div className="flex items-center gap-2 rounded-xl border border-line p-2 pl-3">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{booking.id}</code>
            <button
              onClick={copy}
              className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-background"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={onViewBookings}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-background"
          >
            My bookings
          </button>
          <button
            onClick={onDone}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Book another
          </button>
        </div>
      </div>
    </div>
  );
}

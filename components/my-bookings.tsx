"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { formatDay, formatDayHeading, formatRange } from "@/components/format";
import { cancelBooking, fetchBookings, fetchSlots, queryKeys, type Booking, type Slot } from "@/lib/web-client";

function StatusBadge({ status }: { status: Booking["status"] }) {
  return status === "confirmed" ? (
    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
      Confirmed
    </span>
  ) : (
    <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-muted">Cancelled</span>
  );
}

type MyBookingsProps = {
  /** Prefills the search and runs it straight away (used after a booking is confirmed). */
  initialEmail?: string;
};

export function MyBookings({ initialEmail = "" }: MyBookingsProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState(initialEmail);
  const [email, setEmail] = useState(initialEmail.trim().toLowerCase());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const bookings = useInfiniteQuery({
    queryKey: queryKeys.bookings(email),
    queryFn: ({ pageParam }) => fetchBookings(email, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled: email !== "",
  });
  // Slot details (doctor, time) for each booking come from the shared slots cache.
  const slots = useQuery({ queryKey: queryKeys.slots(""), queryFn: () => fetchSlots("") });
  const slotById = new Map<string, Slot>((slots.data ?? []).map((slot) => [slot.id, slot]));

  const cancel = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      toast.success("Booking cancelled");
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmail(input.trim().toLowerCase());
  };
  const rows = bookings.data?.pages.flatMap((page) => page.bookings) ?? [];

  return (
    <section aria-labelledby="mine-heading" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 id="mine-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          My bookings
        </h1>
        <p className="mt-1 text-muted">Enter the email you booked with to see or cancel your appointments.</p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm">
        <label className="sr-only" htmlFor="lookup-email">
          Email
        </label>
        <input
          id="lookup-email"
          type="email"
          required
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2 outline-none"
        />
        <button className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          Find
        </button>
      </form>

      {bookings.isFetching && rows.length === 0 && (
        <div className="space-y-3" aria-label="Loading bookings">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      )}
      {bookings.isError && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {bookings.error.message}
        </p>
      )}
      {bookings.isSuccess && rows.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-medium">No bookings found</p>
          <p className="mt-1 text-sm text-muted">Nothing is booked under {email}.</p>
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((booking) => {
          const slot = slotById.get(booking.slot_id);
          const confirming = confirmingId === booking.id;
          return (
            <li
              key={booking.id}
              className={`animate-rise rounded-2xl border border-line bg-surface p-4 ${
                booking.status === "cancelled" ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={slot?.provider ?? "?"} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{slot?.provider ?? `Slot ${booking.slot_id}`}</p>
                    <StatusBadge status={booking.status} />
                  </div>
                  {slot && (
                    <p className="text-sm">
                      {formatDayHeading(slot.start)} · {formatRange(slot.start, slot.end)}
                    </p>
                  )}
                  <p className="mt-1 truncate text-xs text-muted">
                    {booking.name} · booked {formatDay(booking.created_at)} · <span className="font-mono">{booking.id}</span>
                  </p>
                </div>
              </div>

              {booking.status === "confirmed" && (
                <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
                  {confirming ? (
                    <>
                      <span className="mr-auto self-center text-sm text-muted">Cancel this appointment?</span>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-background"
                      >
                        Keep
                      </button>
                      <button
                        onClick={() => cancel.mutate(booking.id)}
                        disabled={cancel.isPending}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {cancel.isPending ? "Cancelling…" : "Yes, cancel"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(booking.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {bookings.hasNextPage && (
        <div className="text-center">
          <button
            onClick={() => bookings.fetchNextPage()}
            disabled={bookings.isFetchingNextPage}
            className="rounded-xl border border-line bg-surface px-5 py-2 text-sm font-medium hover:bg-background disabled:opacity-60"
          >
            {bookings.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}

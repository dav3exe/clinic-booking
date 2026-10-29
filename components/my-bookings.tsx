"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { formatDay, formatDayHeading, formatRange } from "@/components/format";
import { cancelBooking, fetchBookings, fetchSlots, queryKeys, type Booking, type Slot } from "@/lib/web-client";

function StatusBadge({ status }: { status: Booking["status"] }) {
  return status === "confirmed" ? (
    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">Confirmed</span>
  ) : (
    <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">Cancelled</span>
  );
}

type MyBookingsProps = {
  /** Prefills the search and runs it straight away (used after a booking is confirmed). */
  initialEmail?: string;
  onBook: () => void;
};

export function MyBookings({ initialEmail = "", onBook }: MyBookingsProps) {
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
    <section aria-labelledby="mine-heading">
      <button
        type="button"
        onClick={onBook}
        className="mb-3 inline-flex items-center gap-1.5 rounded-full py-2 pl-2 pr-4 text-sm font-semibold text-muted transition hover:bg-mint hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to book a visit
      </button>
      <div className="rounded-[2rem] bg-mint px-6 py-10 sm:px-10 sm:py-12">
        <h1 id="mine-heading" className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          My bookings
        </h1>
        <p className="mt-3 max-w-md text-foreground/75">
          Enter the email you booked with to see your visits or cancel one.
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-6 flex max-w-lg gap-2 rounded-full bg-surface p-1.5 shadow-[0_10px_30px_-15px_rgba(6,48,38,0.35)]"
        >
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
            className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-2 outline-none placeholder:text-muted/70"
          />
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-strong">
            Find
          </button>
        </form>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {bookings.isFetching && rows.length === 0 && (
          <div className="space-y-3" aria-label="Loading bookings">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-mint" />
            ))}
          </div>
        )}
        {bookings.isError && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {bookings.error.message}
          </p>
        )}
        {bookings.isSuccess && rows.length === 0 && (
          <div className="rounded-3xl border border-line p-10 text-center">
            <p className="font-display text-xl font-semibold">No bookings found</p>
            <p className="mt-1 text-sm text-muted">Nothing is booked under {email}.</p>
            <button
              onClick={onBook}
              className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-strong"
            >
              Book an appointment
            </button>
          </div>
        )}

        {rows.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((booking) => {
              const slot = slotById.get(booking.slot_id);
              const confirming = confirmingId === booking.id;
              return (
                <li
                  key={booking.id}
                  className={`animate-rise flex flex-col gap-4 py-6 sm:flex-row sm:items-center ${
                    booking.status === "cancelled" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Avatar name={slot?.provider ?? "?"} size="lg" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-semibold">{slot?.provider ?? `Slot ${booking.slot_id}`}</p>
                        <StatusBadge status={booking.status} />
                      </div>
                      {slot && (
                        <p className="text-sm">
                          {formatDayHeading(slot.start)} ·{" "}
                          <span className="font-semibold text-brand">{formatRange(slot.start, slot.end)}</span>
                        </p>
                      )}
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {booking.name} · booked {formatDay(booking.created_at)}
                      </p>
                    </div>
                  </div>

                  {booking.status === "confirmed" && (
                    <div className="flex items-center gap-2 sm:justify-end">
                      {confirming ? (
                        <>
                          <span className="mr-auto text-sm text-muted sm:mr-1">Cancel this visit?</span>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:bg-mint"
                          >
                            Keep
                          </button>
                          <button
                            onClick={() => cancel.mutate(booking.id)}
                            disabled={cancel.isPending}
                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {cancel.isPending ? "Cancelling…" : "Yes, cancel"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(booking.id)}
                          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Cancel visit
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {bookings.hasNextPage && (
          <div className="mt-6 text-center">
            <button
              onClick={() => bookings.fetchNextPage()}
              disabled={bookings.isFetchingNextPage}
              className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold transition hover:bg-mint disabled:opacity-60"
            >
              {bookings.isFetchingNextPage ? "Loading…" : "Show more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

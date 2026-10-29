"use client";

import { Avatar } from "@/components/avatar";
import { formatRange, formatTime, relativeDay } from "@/components/format";
import { useSchedule } from "@/hooks/use-schedule";
import type { Slot } from "@/lib/web-client";

type HeroProps = { onSelect: (slot: Slot) => void; onManage: () => void };

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
      <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NextAvailable({ onSelect }: { onSelect: (slot: Slot) => void }) {
  const schedule = useSchedule();
  const open = (schedule.data?.slots ?? []).filter((slot) => slot.bookable);
  const next = open[0];
  // A few more soon times with other doctors, so the card offers a real choice.
  const others = open.filter((slot) => slot.provider !== next?.provider).slice(0, 3);

  return (
    <div className="relative">
      <div aria-hidden className="absolute -right-6 -top-6 size-40 rounded-full bg-brand-soft blur-2xl" />
      <div className="relative rounded-3xl bg-surface p-6 shadow-[0_20px_50px_-20px_rgba(6,48,38,0.35)] sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Next available</p>

        {schedule.isPending ? (
          <div className="mt-5 space-y-3" aria-label="Loading next available time">
            <div className="h-14 animate-pulse rounded-2xl bg-mint" />
            <div className="h-11 animate-pulse rounded-full bg-mint" />
          </div>
        ) : !next || !schedule.data ? (
          <div className="mt-5">
            <p className="font-display text-xl font-semibold">No open times right now</p>
            <p className="mt-1 text-sm text-muted">New times are added regularly. Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-4">
              <Avatar name={next.provider} size="lg" />
              <div>
                <p className="font-display text-xl font-semibold">{next.provider}</p>
                <p className="text-sm text-muted">
                  {relativeDay(next.start, schedule.data.today, schedule.data.tomorrow)} ·{" "}
                  {formatRange(next.start, next.end)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(next)}
              className="mt-6 w-full rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:bg-brand-strong"
            >
              Book this time
            </button>

            {others.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-medium text-muted">Also soon</p>
                <ul className="mt-3 space-y-2">
                  {others.map((slot) => (
                    <li key={slot.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(slot)}
                        className="flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-mint"
                      >
                        <Avatar name={slot.provider} size="sm" />
                        <span className="flex-1 text-sm font-medium">{slot.provider}</span>
                        <span className="text-sm text-muted">
                          {relativeDay(slot.start, schedule.data.today, schedule.data.tomorrow)}, {formatTime(slot.start)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function Hero({ onSelect, onManage }: HeroProps) {
  const schedule = useSchedule();
  const open = (schedule.data?.slots ?? []).filter((slot) => slot.bookable);
  const doctors = new Set(open.map((slot) => slot.provider)).size;

  return (
    <section className="grid items-center gap-10 rounded-[2rem] bg-mint px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:px-14">
      <div>
        <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl">
          See a doctor
          <br />
          <span className="text-brand">on your schedule</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-foreground/75">
          Book an in-person visit with one of our doctors. Pick a time that works for you, and you&apos;re booked in under
          a minute.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#doctors"
            className="rounded-full bg-brand px-7 py-3.5 font-semibold text-on-brand transition hover:bg-brand-strong"
          >
            Book an appointment
          </a>
          <button
            type="button"
            onClick={onManage}
            className="rounded-full px-5 py-3.5 font-semibold text-brand transition hover:bg-surface/70"
          >
            Manage my bookings
          </button>
        </div>
        {schedule.isSuccess && open.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <li className="flex items-center gap-2">
              <Check /> {doctors} doctor{doctors === 1 ? "" : "s"} available
            </li>
            <li className="flex items-center gap-2">
              <Check /> {open.length} open time{open.length === 1 ? "" : "s"}
            </li>
            <li className="flex items-center gap-2">
              <Check /> Free to cancel
            </li>
          </ul>
        )}
      </div>
      <NextAvailable onSelect={onSelect} />
    </section>
  );
}

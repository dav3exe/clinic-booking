"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import {
  formatDayHeading,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  formatWeekdayShort,
  relativeDay,
} from "@/components/format";
import { useSchedule, type ScheduleSlot } from "@/hooks/use-schedule";
import type { Slot } from "@/lib/web-client";

type SlotListProps = { selectedId: string | null; onSelect: (slot: Slot) => void };

function TimeButton({ slot, selected, onSelect }: { slot: ScheduleSlot; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      disabled={!slot.bookable}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${formatTime(slot.start)} with ${slot.provider}${slot.bookable ? "" : ", booked"}`}
      className={`min-w-[5.5rem] rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition ${
        selected
          ? "border-brand bg-brand text-on-brand"
          : slot.bookable
            ? "border-brand/70 text-brand hover:bg-brand-soft"
            : "cursor-not-allowed border-dashed border-line text-muted line-through decoration-1"
      }`}
    >
      {formatTime(slot.start)}
    </button>
  );
}

export function SlotList({ selectedId, onSelect }: SlotListProps) {
  const schedule = useSchedule();
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  // The patient-facing page only offers what can still be booked; past slots stay out of the way.
  const upcoming = (schedule.data?.slots ?? []).filter((slot) => !slot.past);
  const days = [...new Map(upcoming.map((slot) => [slot.day, slot.start])).entries()];
  const day = pickedDay && days.some(([key]) => key === pickedDay) ? pickedDay : days[0]?.[0];
  const providers = [...new Set(upcoming.map((slot) => slot.provider))].sort();
  const dayStart = days.find(([key]) => key === day)?.[1];

  return (
    <section id="doctors" aria-labelledby="doctors-heading" className="scroll-mt-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="doctors-heading" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Meet our doctors
          </h2>
          <p className="mt-2 text-muted">Choose a day, then tap a time to book.</p>
        </div>
      </div>

      {schedule.isPending && (
        <div className="mt-8 space-y-4" aria-label="Loading schedule">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-16 animate-pulse rounded-2xl bg-mint" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-mint" />
          ))}
        </div>
      )}

      {schedule.isError && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          We couldn&apos;t load the schedule.{" "}
          <button className="font-semibold underline" onClick={() => schedule.refetch()}>
            Try again
          </button>
        </div>
      )}

      {schedule.isSuccess && days.length === 0 && (
        <div className="mt-8 rounded-3xl bg-mint p-10 text-center">
          <p className="font-display text-xl font-semibold">No upcoming times</p>
          <p className="mt-1 text-sm text-muted">Check back soon, new times are added regularly.</p>
        </div>
      )}

      {schedule.data && day && (
        <>
          <div role="tablist" aria-label="Day" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {days.map(([key, start]) => {
              const active = key === day;
              const open = upcoming.filter((slot) => slot.day === key && slot.bookable).length;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${formatDayHeading(start)}, ${open} open`}
                  onClick={() => setPickedDay(key)}
                  className={`flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-2.5 transition ${
                    active ? "border-brand bg-brand text-on-brand" : "border-line hover:border-brand/60 hover:bg-mint"
                  }`}
                >
                  <span className={`text-xs font-medium ${active ? "" : "text-muted"}`}>{formatWeekdayShort(start)}</span>
                  <span className="font-display text-2xl font-bold leading-tight">{formatDayNumber(start)}</span>
                  <span className={`text-[11px] ${active ? "opacity-90" : "text-muted"}`}>
                    {open > 0 ? `${open} open` : formatMonthShort(start)}
                  </span>
                </button>
              );
            })}
          </div>

          {dayStart && (
            <p className="mt-6 text-sm font-semibold">
              {relativeDay(dayStart, schedule.data.today, schedule.data.tomorrow)}
              {relativeDay(dayStart, schedule.data.today, schedule.data.tomorrow) !== formatDayHeading(dayStart) && (
                <span className="font-normal text-muted"> · {formatDayHeading(dayStart)}</span>
              )}
            </p>
          )}

          <ul className="mt-3 divide-y divide-line border-y border-line">
            {providers.map((provider) => {
              const times = upcoming.filter((slot) => slot.day === day && slot.provider === provider);
              const open = times.filter((slot) => slot.bookable).length;
              const nextOpen = upcoming.find((slot) => slot.provider === provider && slot.bookable && slot.day > day);
              return (
                <li key={provider} className="animate-rise grid gap-4 py-6 md:grid-cols-[16rem_1fr] md:gap-8">
                  <div className="flex items-center gap-4">
                    <Avatar name={provider} size="lg" />
                    <div>
                      <p className="font-display text-lg font-semibold">{provider}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        <span
                          aria-hidden
                          className={`size-2 rounded-full ${open > 0 ? "bg-brand" : "bg-line"}`}
                        />
                        {open > 0 ? `${open} open time${open === 1 ? "" : "s"}` : "Fully booked this day"}
                      </p>
                    </div>
                  </div>

                  {times.length > 0 ? (
                    <div className="flex flex-wrap content-center gap-2">
                      {times.map((slot) => (
                        <TimeButton
                          key={slot.id}
                          slot={slot}
                          selected={slot.id === selectedId}
                          onSelect={() => onSelect(slot)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-muted">No times this day.</div>
                  )}

                  {open === 0 && nextOpen && (
                    <button
                      type="button"
                      onClick={() => setPickedDay(nextOpen.day)}
                      className="justify-self-start text-sm font-semibold text-brand hover:underline md:col-start-2"
                    >
                      Next available: {relativeDay(nextOpen.start, schedule.data.today, schedule.data.tomorrow)},{" "}
                      {formatTime(nextOpen.start)} ›
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

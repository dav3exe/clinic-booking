"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { dayKey, formatDayHeading, formatTime } from "@/components/format";
import { fetchSlots, queryKeys, type Slot } from "@/lib/web-client";

type SlotListProps = { selectedId: string | null; onSelect: (slot: Slot) => void };
type SlotRow = Slot & { past: boolean };

function groupByDay(slots: SlotRow[]) {
  const days = new Map<string, SlotRow[]>();
  for (const slot of slots) {
    const key = dayKey(slot.start);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }
  return [...days.values()];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-line bg-surface text-foreground hover:border-teal-500"
      }`}
    >
      {children}
    </button>
  );
}

export function SlotList({ selectedId, onSelect }: SlotListProps) {
  const [provider, setProvider] = useState("");
  const [showPast, setShowPast] = useState(false);
  const slots = useQuery({
    queryKey: queryKeys.slots(provider),
    queryFn: () => fetchSlots(provider),
    // Evaluated on each fetch (not during render) so "past" stays pure.
    select: (data) => data.map((slot) => ({ ...slot, past: new Date(slot.start).getTime() <= Date.now() })),
  });
  // Provider options come from the unfiltered list so the chips do not collapse after filtering.
  const all = useQuery({ queryKey: queryKeys.slots(""), queryFn: () => fetchSlots("") });
  const providers = [...new Set((all.data ?? []).map((slot) => slot.provider))].sort();

  const visible = (slots.data ?? []).filter((slot) => showPast || !slot.past);
  const pastCount = (slots.data ?? []).length - visible.length;
  const days = groupByDay(visible);

  return (
    <section aria-labelledby="slots-heading" className="min-w-0 space-y-5">
      <h2 id="slots-heading" className="sr-only">
        Available slots
      </h2>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={provider === ""} onClick={() => setProvider("")}>
          All doctors
        </Chip>
        {providers.map((name) => (
          <Chip key={name} active={provider === name} onClick={() => setProvider(name)}>
            <Avatar name={name} size="sm" />
            {name}
          </Chip>
        ))}
      </div>

      {slots.isPending && (
        <div className="space-y-3" aria-label="Loading slots">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      )}

      {slots.isError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          We couldn&apos;t load the schedule.{" "}
          <button className="font-medium underline" onClick={() => slots.refetch()}>
            Try again
          </button>
        </div>
      )}

      {slots.isSuccess && days.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-medium">No upcoming slots</p>
          <p className="mt-1 text-sm text-muted">Check back soon, new times are added regularly.</p>
        </div>
      )}

      {days.map((daySlots) => {
        const open = daySlots.filter((slot) => slot.available && !slot.past).length;
        return (
          <div key={dayKey(daySlots[0].start)} className="animate-rise rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{formatDayHeading(daySlots[0].start)}</h3>
              <span className="text-xs text-muted">{open} open</span>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {daySlots.map((slot) => {
                const bookable = slot.available && !slot.past;
                const selected = slot.id === selectedId;
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      disabled={!bookable}
                      onClick={() => onSelect(slot)}
                      aria-pressed={selected}
                      aria-label={`${formatTime(slot.start)} with ${slot.provider}${bookable ? "" : slot.past ? ", past" : ", booked"}`}
                      className={`group flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                        selected
                          ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600 dark:bg-teal-950/40"
                          : bookable
                            ? "border-line hover:-translate-y-px hover:border-teal-500 hover:shadow-sm"
                            : "cursor-not-allowed border-transparent bg-background opacity-60"
                      }`}
                    >
                      <Avatar name={slot.provider} size="sm" />
                      <span className="min-w-0">
                        <span className={`block font-semibold tabular-nums ${bookable ? "" : "line-through decoration-1"}`}>
                          {formatTime(slot.start)}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {bookable ? slot.provider : slot.past ? "Past" : "Booked"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {pastCount > 0 && (
        <button onClick={() => setShowPast((v) => !v)} className="text-sm text-muted underline hover:text-foreground">
          {showPast ? "Hide past slots" : `Show ${pastCount} past slot${pastCount === 1 ? "" : "s"}`}
        </button>
      )}
    </section>
  );
}

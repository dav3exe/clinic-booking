"use client";

import { useRef, useState } from "react";
import { BookingConfirmation } from "@/components/booking-confirmation";
import { BrandMark } from "@/components/brand-mark";
import { BookingForm } from "@/components/booking-form";
import { MyBookings } from "@/components/my-bookings";
import { SlotList } from "@/components/slot-list";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Booking, Slot } from "@/lib/web-client";

type Tab = "book" | "mine";

const STEPS = ["Choose a time", "Your details", "Confirmed"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex size-6 items-center justify-center rounded-full border text-[11px] ${
                done
                  ? "border-teal-600 bg-teal-600 text-white"
                  : active
                    ? "border-teal-600 text-teal-700 dark:text-teal-300"
                    : "border-line text-muted"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`hidden sm:inline ${active ? "text-foreground" : "text-muted"}`}>{label}</span>
            {i < STEPS.length - 1 && <span aria-hidden className="h-px w-5 bg-line sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

export function BookingApp() {
  const [tab, setTab] = useState<Tab>("book");
  const [selected, setSelected] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState<{ booking: Booking; slot: Slot } | null>(null);
  // Set only when arriving from a confirmation, so My bookings opens already searched for that email.
  const [lookupEmail, setLookupEmail] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const step = confirmed ? 2 : selected ? 1 : 0;

  const select = (slot: Slot) => {
    setConfirmed(null);
    setSelected(slot);
    // On phones the panel sits below the list, so bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const reset = () => {
    setConfirmed(null);
    setSelected(null);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <BrandMark />
          <div className="flex items-center gap-2">
            <nav aria-label="Sections" className="flex rounded-full border border-line bg-background p-1 text-sm">
              {(
                [
                  ["book", "Book"],
                  ["mine", "My bookings"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    // Opening My bookings from the header starts with an empty search.
                    setLookupEmail("");
                    setTab(value);
                  }}
                  aria-current={tab === value ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                    tab === value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {tab === "book" ? (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Book an appointment</h1>
                <p className="mt-1 text-muted">Pick a time that suits you. It takes less than a minute.</p>
              </div>
              <Steps current={step} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <SlotList selectedId={selected?.id ?? null} onSelect={select} />
              <div ref={panelRef} className="scroll-mt-20">
                <div className="lg:sticky lg:top-24">
                  {confirmed ? (
                    <BookingConfirmation
                      booking={confirmed.booking}
                      slot={confirmed.slot}
                      onDone={reset}
                      onViewBookings={() => {
                        setLookupEmail(confirmed.booking.email);
                        reset();
                        setTab("mine");
                      }}
                    />
                  ) : selected ? (
                    <BookingForm
                      // New form state (and idempotency key) whenever a different slot is picked.
                      key={selected.id}
                      slot={selected}
                      onCancel={() => setSelected(null)}
                      onBooked={(booking) => setConfirmed({ booking, slot: selected })}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center">
                      <p className="font-medium">No time selected</p>
                      <p className="mt-1 text-sm text-muted">Choose an available slot to continue.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Keyed by the email so a new hand-off remounts it with fresh, pre-searched state.
          <MyBookings key={lookupEmail} initialEmail={lookupEmail} />
        )}
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Need to change something? Cancel from My bookings and book a new time.
      </footer>
    </div>
  );
}

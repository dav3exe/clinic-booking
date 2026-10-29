"use client";

import { useCallback, useState } from "react";
import { BookingConfirmation } from "@/components/booking-confirmation";
import { BookingForm } from "@/components/booking-form";
import { BrandMark } from "@/components/brand-mark";
import { Hero } from "@/components/hero";
import { MyBookings } from "@/components/my-bookings";
import { Sheet } from "@/components/sheet";
import { SlotList } from "@/components/slot-list";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Booking, Slot } from "@/lib/web-client";

type Tab = "book" | "mine";

const SHEET_TITLE_ID = "booking-sheet-title";

// [value, label, shorter label for phones]
const TABS = [
  ["book", "Book a visit", "Book"],
  ["mine", "My bookings", "Bookings"],
] as const;

export function BookingApp() {
  const [tab, setTab] = useState<Tab>("book");
  const [selected, setSelected] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState<{ booking: Booking; slot: Slot } | null>(null);
  // Set only when arriving from a confirmation, so My bookings opens already searched for that email.
  const [lookupEmail, setLookupEmail] = useState("");

  const select = (slot: Slot) => {
    setConfirmed(null);
    setSelected(slot);
  };

  // Stable so the sheet's Escape listener is not re-attached on every render.
  const closeSheet = useCallback(() => {
    setConfirmed(null);
    setSelected(null);
  }, []);

  const goTo = (next: Tab) => {
    // Opening My bookings from the header starts with an empty search.
    setLookupEmail("");
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => goTo("book")} aria-label="Clinic home" className="rounded-full">
            <BrandMark />
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <nav aria-label="Sections" className="flex items-center gap-1 text-sm font-semibold">
              {TABS.map(([value, label, short]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => goTo(value)}
                  aria-current={tab === value ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-2 transition sm:px-4 ${
                    tab === value ? "bg-mint text-brand" : "text-muted hover:text-foreground"
                  }`}
                >
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
        {tab === "book" ? (
          <div className="space-y-16 sm:space-y-20">
            <Hero onSelect={select} onManage={() => goTo("mine")} />
            <SlotList selectedId={selected?.id ?? null} onSelect={select} />
          </div>
        ) : (
          // Keyed by the email so a new hand-off remounts it with fresh, pre-searched state.
          <MyBookings key={lookupEmail} initialEmail={lookupEmail} onBook={() => goTo("book")} />
        )}
      </main>

      <footer className="mt-20 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandMark />
          <p>Need to change a visit? Cancel it from My bookings, then pick a new time.</p>
        </div>
      </footer>

      <Sheet open={selected !== null || confirmed !== null} onClose={closeSheet} labelledBy={SHEET_TITLE_ID}>
        {confirmed ? (
          <BookingConfirmation
            booking={confirmed.booking}
            slot={confirmed.slot}
            titleId={SHEET_TITLE_ID}
            onDone={closeSheet}
            onViewBookings={() => {
              const email = confirmed.booking.email;
              closeSheet();
              setLookupEmail(email);
              setTab("mine");
              window.scrollTo({ top: 0 });
            }}
          />
        ) : (
          selected && (
            <BookingForm
              // New form state (and idempotency key) whenever a different slot is picked.
              key={selected.id}
              slot={selected}
              titleId={SHEET_TITLE_ID}
              onCancel={closeSheet}
              onBooked={(booking) => setConfirmed({ booking, slot: selected })}
            />
          )
        )}
      </Sheet>
    </div>
  );
}

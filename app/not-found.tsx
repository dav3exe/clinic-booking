import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Page not found · Clinic Appointments" };

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Clinic Appointments home">
            <BrandMark />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="animate-rise w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface text-center shadow-sm">
          <div className="bg-teal-50/60 px-6 pt-10 pb-8 dark:bg-teal-950/20">
            {/* An empty calendar day: "nothing booked here". */}
            <svg viewBox="0 0 64 64" aria-hidden className="mx-auto size-16 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={3}>
              <rect x="8" y="12" width="48" height="44" rx="8" />
              <path d="M8 26h48M22 6v12M42 6v12" strokeLinecap="round" />
              <path d="m26 36 12 12M38 36 26 48" strokeLinecap="round" />
            </svg>
            <p className="mt-5 text-sm font-semibold tracking-widest text-teal-700 dark:text-teal-300">ERROR 404</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">This page isn&apos;t on the schedule</h1>
          </div>

          <div className="space-y-5 p-6">
            <p className="text-muted">
              The link may be wrong or the page may have moved. Your appointments are safe, you can book or
              look them up from the home page.
            </p>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Back to appointments
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Need to change something? Cancel from My bookings and book a new time.
      </footer>
    </div>
  );
}

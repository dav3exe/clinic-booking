"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SheetProps = { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode };

/** Modal panel: a bottom sheet on phones, a centred dialog from `sm` up. Escape or the backdrop closes it. */
export function Sheet({ open, onClose, labelledBy, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden className="animate-fade absolute inset-0 bg-[#04120f]/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="animate-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl outline-none sm:max-w-md sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-mint hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

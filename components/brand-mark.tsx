export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
        {/* Solid medical cross: equal, broad arms with softened corners. */}
        <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
          <path d="M9.5 3.5h5a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4h-4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4v-4a1 1 0 0 1 1-1z" />
        </svg>
      </span>
      {/* Wordmark hides on the narrowest phones so the header controls fit. */}
      <div className="hidden leading-tight min-[400px]:block">
        <p className="font-semibold">Clinic</p>
        <p className="text-xs text-muted">Appointments</p>
      </div>
    </div>
  );
}

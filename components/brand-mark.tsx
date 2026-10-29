export function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand text-on-brand">
        {/* Solid medical cross: equal, broad arms with softened corners. */}
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M9.5 3.5h5a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4h-4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4v-4a1 1 0 0 1 1-1z" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        clinic<span className="text-brand">.</span>
      </span>
    </span>
  );
}

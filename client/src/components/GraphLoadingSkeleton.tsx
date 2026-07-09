export function GraphLoadingSkeleton() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background">
      <div className="relative h-48 w-48">
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-accent bg-surface-elevated" />
        <div className="absolute left-1/2 top-4 h-9 w-9 -translate-x-1/2 animate-pulse rounded-lg border border-accent-secondary/40 bg-surface" />
        <div className="absolute bottom-6 left-4 h-9 w-9 animate-pulse rounded-full border border-white/10 bg-surface" />
        <div className="absolute bottom-8 right-2 h-9 w-9 animate-pulse rounded-full border border-white/10 bg-surface" />
        <div className="absolute left-1/2 top-1/2 h-px w-20 -translate-x-1/2 -translate-y-8 bg-white/10" />
        <div className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 translate-y-4 rotate-45 bg-white/10" />
        <div className="absolute left-1/2 top-1/2 h-px w-14 -translate-x-1/2 translate-y-6 -rotate-45 bg-white/10" />
      </div>
      <p className="mt-8 text-sm text-text-muted">Loading your network…</p>
    </div>
  );
}

export function MemorySkeleton() {
  return (
    <div className="rounded-2xl border border-ink-border p-5 animate-pulse space-y-3">
      <div className="h-3 w-24 bg-ink-light rounded" />
      <div className="h-4 w-3/4 bg-ink-light rounded" />
      <div className="h-3 w-full bg-ink-light rounded" />
      <div className="h-3 w-5/6 bg-ink-light rounded" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square bg-ink-light rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
